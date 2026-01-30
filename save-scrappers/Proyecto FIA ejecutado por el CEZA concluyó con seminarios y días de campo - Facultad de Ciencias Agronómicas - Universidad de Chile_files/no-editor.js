
// identifica contenido relacionado y oculta modulos y columna si no hay contenido
var link = true;
var atta = true;
var imag = true;
var info = true;

if (!$('.final__links').children().length > 0) {
  link = false;
}
if (!$('.final__attachments').children().length > 0) {
  atta = false;
}
if ( !$('.final__images').children().length > 0) {
  imag = false;
}
if ( !$('.final__info').children().length > 0) {
  info = false;
}
if ( link | atta | imag | info ) {
  $('.final__aside').show();
  
  // Para agenda Medicina
  $('.medicina.mainActividad .content__detail').addClass("max-width");
}
if (!$('.final__links').children().length > 0) {
  $('.final__links').hide();
}
if (!$('.final__attachments').children().length > 0) {
  $('.final__attachments').hide();
}
if ( !$('.final__images').children().length > 0) {
  $('.final__images').hide();
}
if ( !$('.final__info').children().length > 0) {
  $('.final__info').hide();
}



if (window.location.hash != "") {
    if (window.location.hash == '#ok') {
        alert('Su mensaje fue enviado exitosamente.');
    }
}

// Oculta agenda en portada vacía
$('.mod-cal-date ul li').length;
if ($('.mod-cal-date ul li').length == 0) {
  $(".mod-cal-date").remove();
}


// Cursos y diplomas - BTN Inscríbete aquí
$('.courses .final__content p:contains("%%") a, .postgraduate .final__content p:contains("%%") a').addClass('btn_inscribete').appendTo('.courses__call');
$('.courses .final__content p:contains("%%"), .postgraduate .final__content p:contains("%%")').hide();


// Cursos y diplomas - HORA (00:00 hrs.)
var str = $(".courses .courses___item_date ul li").text();
var limpia = str.trim();
var validaHora = limpia.split(" - ").pop();
if ($.trim(validaHora) == "00:00 hrs.") {
  $(".courses .courses___item_date ul li").html(str.slice(0, -82))
}


// Cursos y diplomas - Fecha sin día
$(".courses .final__content p:contains('@@')").addClass("nuevoMes").appendTo(".courses___item_date ul");
var mes = $(".nuevoMes").text().slice(2);
$(".nuevoMes").text(mes);
if ($(".courses___item_date p").hasClass("nuevoMes")) {
  $(".courses___item_date ul li:contains(' al ')").hide();
  $(".courses___item_date h3").text("Fecha:");
}

// EIC vinculado portada
var linked = $(".eic.portada .mod_linked .mod__item");
$(linked).click(function() {
    window.location = $(this).find("a").attr("href");
    return false;
});





// bxslider : Carrusel
$('.carrusel .bxslider').bxSlider({
    auto: true,
    autoHover: true,
    touchEnabled: false,
    captions: true,
    keyboardEnabled: true,
    mode: 'fade',
    infiniteLoop: true
});



// bxslider : Carrusel fotonoticias en Derecho
$('.fotonoticias .bxslider').bxSlider({
    auto: true,
    autoHover:true,
    touchEnabled: false,
    captions: true
});

// bxslider : Carrusel Novedades en Derecho TSD
$('.novedades .bxslider').bxSlider({
    auto: true
});

// bxslider : Derecho destacados vertical
$('.destacadosv .bxslider').bxSlider({
   mode: 'vertical',
   minSlides: 3,
   slideMargin: 0,
   moveSlides: 1,
   touchEnabled: false
});

// bxslider : Derecho Biblioteca 2 Revistas
$('.carrusel-revistas .bxslider').bxSlider({
    auto: true,
    mode: 'horizontal',
    moveSlides: 1,
    maxSlides: 3,
    slideMargin: 30,
    slideWidth: 320,
    infiniteLoop: true,
    touchEnabled: false,
    responsive: true
})

// Medicina bxslider destacados 
$('.medicina .banner__featured .carousel-inner > .bxslider').bxSlider({
   mode: 'vertical',
   minSlides: 2,
   slideMargin: 6,
   touchEnabled: false
});

// Medicina portada transforma div en boton -- va en no-edit.js
  var botones = $(".medicina.portada .mod_highlight.botones .mod__item");
  $(botones).click(function() {
    window.location = $(this).find(".mod__item-link").attr("href");
    return false;
  });

// Medicina oculta campos vacios en ficha postgrado
$(".medicina .detail__postulaciones .pst:empty").parent().hide();
$(".medicina .detail__descripcion .dsc:empty").parent().hide();
$(".medicina .detail__planestudio .pln:empty").parent().hide();
$(".medicina .detail__requisitos .req:empty").parent().hide();


// Agrega itemprop en fotos
$('.content__description .detail__img img').attr('itemprop', 'image');


// LLamado para subportadas.js
if ($('#content').hasClass('subportada-e')) {
    
	// 180 Aniversario - Ejecuta funcion slider actividades
    $( document ).ready(function() {
            var swiper2 = new Swiper('.subportada-e.aniversario .subportada__siete .mod_highlight .mod__list', {
            slidesPerView: 3,
            spaceBetween: 0,
            loop: true,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            breakpoints: {
                1024: {
                    slidesPerView: 3,
                },
                768: {
                    slidesPerView: 2,
                },
                320: {
                    slidesPerView: 1,
                },
            }
        });
    });
    
    
}



