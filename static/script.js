$(document).ready(function () {
  $("#nav li a").on("click", navbarBtnClick);
  $(document).on("click", closeToggle);
  // $("#home").hide().fadeIn(1000);
});

/* close toggle if it's open and clicked outside toggle */
function closeToggle(event) {
  var clickover = $(event.target);
  var _opened = $(".navbar-collapse").hasClass("in");
  // BUG: hasClass("navbar-toggle") doesn't quite work like it should
  if (_opened === true && !clickover.hasClass("navbar-toggle")) {
      $("button.navbar-toggle").click();
  }
}

function navbarBtnClick(event) {
  // Make sure this.hash has a value before overriding default behavior
  if (this.hash !== "") {

    // Prevent default anchor click behavior
    event.preventDefault();

    // Store hash (#)
    var hash = this.hash;

    // Using jQuery's animate() method to add smooth page scroll
    // The optional number (800) specifies the number of milliseconds it takes to scroll to the specified area (the speed of the animation)
    $('html, body').animate({
      scrollTop: $(hash).offset().top
    }, 800, function(){

      // Add hash (#) to URL when done scrolling (default click behavior)
      window.location.hash = hash;
    });
  } // End if statement
  $(".navbar-collapse").collapse('hide');
}