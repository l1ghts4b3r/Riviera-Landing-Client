/* Shared navigation for the home and news pages. */
jQuery(function ($) {
  "use strict";
  var sections = $("#pagepiling > .section");
  var desktop = window.matchMedia("(min-width: 1280px)");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var initialized = false;
  var desktopMode = null;
  var menuOpen = false;
  var mobileMenu = false;
  var labels = {
    comunidades: "Comunidades", inicio: "Inicio", edpr: "Ecosistema DPR",
    comunidadc: "Comunidad Confiable", buroc: "Buro Confiable", noticia1: "Noticia"
  };

  function hashTarget() {
    // Retain links shared before the section names were updated.
    var aliases = { rm: "edpr", aicm: "comunidadc", marcelina: "buroc" };
    var id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); }
    catch (error) { return null; }
    if (aliases[id]) {
      id = aliases[id];
      history.replaceState(null, "", "#" + id);
    }
    var target = document.getElementById(id);
    return target && sections.is(target) ? target : null;
  }

  function markActive(id) {
    $(".nav-menu a").each(function () {
      var active = this.hash === "#" + id;
      $(this).toggleClass("active", active);
      if (active) this.setAttribute("aria-current", "location");
      else this.removeAttribute("aria-current");
    });
  }

  function setMenu(open, mobile, restoreFocus) {
    menuOpen = open;
    mobileMenu = mobile;
    $(".side_nav").toggleClass("expand_nav", open && !mobile);
    $("#my_tog").toggleClass("close_nav", open && !mobile)
      .attr("aria-expanded", String(open && !mobile))
      .attr("aria-label", open && !mobile ? "Cerrar menú" : "Abrir menú");
    $(".my_nav_tog").attr("aria-expanded", String(open && mobile));
    $(".broad").toggleClass("broad-nav", open && mobile).css("opacity", open && mobile ? 1 : 0)
      .prop("inert", !(open && mobile));
    $("#desktop-menu").prop("inert", !open);
    $("body").toggleClass("show-modal", open && mobile);
    $("#pp-nav").toggle(desktopMode && !open);
    if (initialized) {
      $.fn.pagepiling.setAllowScrolling(desktopMode && !open);
      $.fn.pagepiling.setKeyboardScrolling(desktopMode && !open);
    }
    if (open) {
      // Wait for the existing menu transition before focusing its controls.
      setTimeout(function () {
        if (menuOpen && mobileMenu === mobile) {
          $(mobile ? "#btn_sideNavClose" : "#desktop-menu a").first().trigger("focus");
        }
      }, reducedMotion.matches ? 0 : 550);
    } else if (restoreFocus) {
      $(mobile ? ".my_nav_tog" : "#my_tog").trigger("focus");
    }
  }

  function navigate(target, updateHistory) {
    if (!target) return;
    if (desktopMode) {
      $.fn.pagepiling.moveTo(sections.index(target) + 1);
    } else {
      var offset = $(window).width() < 768 ? 65 : 0;
      $("html, body").stop(true).animate({ scrollTop: Math.max(0, $(target).offset().top - offset) },
        reducedMotion.matches ? 0 : 100);
    }
    if (updateHistory && window.location.hash !== "#" + target.id) {
      history.pushState(null, "", "#" + target.id);
    }
    markActive(target.id);
  }

  function configureViewport() {
    if (desktopMode === desktop.matches) return;
    var target = hashTarget() || sections[0];
    desktopMode = desktop.matches;
    $("html").toggleClass("natural-scroll", !desktopMode);
    if (desktopMode && !initialized) {
      $("#pagepiling").pagepiling({
        anchors: sections.map(function () { return this.id; }).get(),
        sectionsColor: sections.map(function () { return "#171717"; }).get(),
        menu: "#menu", scrollingSpeed: reducedMotion.matches ? 0 : 500,
        easing: "linear", css3: true,
        navigation: { bulletsColor: "#535353", position: "left",
          tooltips: sections.map(function () { return labels[this.id] || this.id; }).get() },
        onLeave: function (index, nextIndex) {
          markActive(sections[nextIndex - 1].id);
          if (!reducedMotion.matches) {
            var animated = sections.eq(nextIndex - 1).find(".wow");
            animated.addClass("animated fadeIn").css("visibility", "visible");
            setTimeout(function () { animated.removeClass("animated fadeIn"); }, 1800);
          }
        }
      });
      initialized = true;
      $("#pp-nav a").each(function (index) { $(this).attr("aria-label", labels[sections[index].id]); });
    }
    setMenu(false, false, false);
    if (desktopMode) window.scrollTo(0, 0);
    navigate(target, false);
  }

  $("#my_tog").on("click", function () { setMenu(!menuOpen, false, menuOpen); });
  $(".my_nav_tog").on("click", function () { setMenu(true, true, false); });
  $("#btn_sideNavClose").on("click", function () { setMenu(false, true, true); });
  $(document).on("keydown", function (event) {
    if (!menuOpen) return;
    if (event.key === "Escape") { setMenu(false, mobileMenu, true); return; }
    if (event.key !== "Tab") return;
    var focusable = $(mobileMenu ? "#mobile-menu" : ".side_nav").find("a[href], button").filter(":visible");
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  $("a[href^='#']").not("#pp-nav a").on("click", function (event) {
    var target = document.getElementById(this.hash.slice(1));
    if (!target || !sections.is(target)) return;
    event.preventDefault();
    setMenu(false, mobileMenu, menuOpen);
    navigate(target, true);
  });
  $(window).on("hashchange popstate", function (event) {
    var target = hashTarget();
    if (!desktopMode || !target) event.stopImmediatePropagation();
    navigate(target, false);
  });
  $(window).on("resize", function () {
    configureViewport();
    if (menuOpen && mobileMenu !== ($(window).width() < 768)) setMenu(false, mobileMenu, false);
  });
  $(window).on("scroll", function () {
    var fixed = $(window).width() < 768 && $(window).scrollTop() > 300;
    $("#home").toggleClass("fixed-top fix-top", fixed);
    $("#pagepiling").toggleClass("margin-manage", fixed);
    $("header").toggleClass("header-appear", $(window).scrollTop() > 260);
  });
  configureViewport();
  // Initialize after resources load so anchor offsets include image dimensions.
  $(window).on("load", function () {
    navigate(hashTarget(), false);
    $("#loader-fade").fadeOut(reducedMotion.matches ? 0 : "slow");
  });
  if (!reducedMotion.matches && $(window).width() > 991) {
    new WOW({ mobile: false }).init();
    if ($("#animated-cursor").length) animatedCursor();
  }
});

function animatedCursor() {
  if ($("#animated-cursor").length) {
    var e = { x: 0, y: 0 },
      t = { x: 0, y: 0 },
      n = 0.25,
      o = !1,
      a = document.getElementById("cursor"),
      i = document.getElementById("cursor-loader");
    TweenLite.set(a, { xPercent: -50, yPercent: -50 }),
      document.addEventListener("mousemove", function (t) {
        var n = window.pageYOffset || document.documentElement.scrollTop;
        (e.x = t.pageX), (e.y = t.pageY - n);
      }),
      TweenLite.ticker.addEventListener("tick", function () {
        o ||
          ((t.x += (e.x - t.x) * n),
          (t.y += (e.y - t.y) * n),
          TweenLite.set(a, { x: t.x, y: t.y }));
      }),
      $(".animated-wrap").mouseenter(function (e) {
        TweenMax.to(this, 0.3, { scale: 2 }),
          TweenMax.to(a, 0.3, {
            scale: 2,
            borderWidth: "1px",
            opacity: 0.2,
          }),
          TweenMax.to(i, 0.3, {
            scale: 2,
            borderWidth: "1px",
            top: 1,
            left: 1,
          }),
          TweenMax.to($(this).children(), 0.3, { scale: 0.5 }),
          (o = !0);
      }),
      $(".animated-wrap").mouseleave(function (e) {
        TweenMax.to(this, 0.3, { scale: 1 }),
          TweenMax.to(a, 0.3, {
            scale: 1,
            borderWidth: "2px",
            opacity: 1,
          }),
          TweenMax.to(i, 0.3, {
            scale: 1,
            borderWidth: "2px",
            top: 0,
            left: 0,
          }),
          TweenMax.to($(this).children(), 0.3, { scale: 1, x: 0, y: 0 }),
          (o = !1);
      }),
      $(".testimonial-images .animated-wrap").mouseenter(function (e) {
        TweenMax.to(this, 0.3, { scale: 2 }),
          TweenMax.to(a, 0.3, {
            scale: 2,
            borderWidth: "1px",
            opacity: 0.2,
          }),
          TweenMax.to(i, 0.3, {
            scale: 2,
            borderWidth: "1px",
            top: 1,
            left: 1,
          }),
          TweenMax.to($(this).children(), 0.3, { scale: 0.5 }),
          (o = !0);
      }),
      $(".animated-wrap").mousemove(function (e) {
        var n, o, i, l, r, d, c, s, p, h, x, u, w, f, m;
        (n = e),
          (o = 2),
          (i = this.getBoundingClientRect()),
          (l = n.pageX - i.left),
          (r = n.pageY - i.top),
          (d = window.pageYOffset || document.documentElement.scrollTop),
          (t.x = i.left + i.width / 2 + (l - i.width / 2) / o),
          (t.y = i.top + i.height / 2 + (r - i.height / 2 - d) / o),
          TweenMax.to(a, 0.3, {
            x: t.x,
            y: t.y,
          }),
          (s = e),
          (p = c = this),
          (h = c.querySelector(".animated-element")),
          (x = 20),
          (u = p.getBoundingClientRect()),
          (w = s.pageX - u.left),
          (f = s.pageY - u.top),
          (m = window.pageYOffset || document.documentElement.scrollTop),
          TweenMax.to(h, 0.3, {
            x: ((w - u.width / 2) / u.width) * x,
            y: ((f - u.height / 2 - m) / u.height) * x,
            ease: Power2.easeOut,
          });
      }),
      $(".hide-cursor,.btn,.tp-bullets").mouseenter(function (e) {
        TweenMax.to("#cursor", 0.2, {
          borderWidth: "1px",
          scale: 2,
          opacity: 0,
        });
      }),
      $(".hide-cursor,.btn,.tp-bullets").mouseleave(function (e) {
        TweenMax.to("#cursor", 0.3, {
          borderWidth: "2px",
          scale: 1,
          opacity: 1,
        });
      }),
      $(".link").mouseenter(function (e) {
        TweenMax.to("#cursor", 0.2, {
          borderWidth: "0px",
          scale: 3,
          backgroundColor: "rgba(5,5,5,0.27)",
          opacity: 0.15,
        });
      }),
      $(".link").mouseleave(function (e) {
        TweenMax.to("#cursor", 0.3, {
          borderWidth: "2px",
          scale: 1,
          backgroundColor: "rgba(12,12,12,0)",
          opacity: 1,
        });
      });
  }
}
