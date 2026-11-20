jQuery(function ($) {
  "use strict";
  var carousel = $("#portfolio .owl-carousel");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  carousel.owlCarousel({
    items: 1, margin: 30, dots: false, nav: false, loop: true,
    autoplay: !reducedMotion, smartSpeed: reducedMotion ? 0 : 500,
    autoplayHoverPause: true
  });
  $("#team-circle-left").on("click", function () {
    carousel.trigger("prev.owl.carousel");
  });
  $("#team-circle-right").on("click", function () {
    carousel.trigger("next.owl.carousel");
  });
  $("#portfolio [data-fancybox]").fancybox({
    protect: true, animationEffect: reducedMotion ? false : "fade", hash: false,
    beforeShow: function () {
      carousel.trigger("stop.owl.autoplay");
      if ($(".pp-section").length) {
        $.fn.pagepiling.setAllowScrolling(false);
        $.fn.pagepiling.setKeyboardScrolling(false);
      }
    },
    afterClose: function () {
      if (!reducedMotion) carousel.trigger("play.owl.autoplay");
      if ($(".pp-section").length && !$("html").hasClass("natural-scroll")) {
        $.fn.pagepiling.setAllowScrolling(true);
        $.fn.pagepiling.setKeyboardScrolling(true);
      }
    }
  });
});
