/*
JDS Slideshow 1.0
Written by: Joey Dehnert 
Twitter: @joeydehnert
Slideshow Demo: http://joeydehnert.com/jds-slideshow-a-responsive-and-touch-enabled-slideshow-plugin-for-jquery-and-require-js/
Licensed under the MIT license.
*/
$.fn.jdSlideshow = function(options) {

	var settings = $.extend({
		pagi: true,
		autoAdvance: false,
		ajaxOn: true
	}, options);

	return this.each(function() {        

		var slideshowID = $(this).attr("id"),
		 	jds = {
		
			outerContainer: $(this).parent(".slideshow-container"),
			container: $("#" + slideshowID),
			slideshowDataID: $(".jds-slideshow").attr("data-slideshow-id"),
			slides: $(".jds-slides"),
			slidesWidth: null,
			slide: $(".jds-slide"),
			slideWidth: null,
			slideIndex: 1,
			slideCount: null,
			loading: false,
			prevBtn: $(".btn-prev"),
			nextBtn: $(".btn-next"),
			pagi: false,
			pagiContain: null,
			autoAdvance: false,
			init: function(){
					
				jds.pagi = settings.pagi;
				jds.autoAdvance = settings.autoAdvance;

				// set specific values for each slideshow on the page
				jds.slideWidth = jds.slide.outerWidth();
				jds.slideCount = jds.container.find(jds.slide).length;
				
				// apply some css
				jds.container.find(jds.slide).each(function(i){
					
					if(i == 0){
						
						if (navigator.userAgent.indexOf("MSIE") != -1){
							
							$(this).css({
								left: "0px",
							});

						} else {

							$(this).css({
								webkitTransform: "translate3d(0px,0,0)",
								MozTransform: "translate3d(0px,0,0)",
								transform: "translate3d(0px,0,0)"
							});

						}
						
					} else {
						
						if (navigator.userAgent.indexOf("MSIE") != -1){
							
							$(this).css({
								left: jds.slideWidth + "px",
							});

						} else {

							$(this).css({
								webkitTransform: "translate3d(" + jds.slideWidth + "px,0,0)",
								MozTransform: "translate3d(" + jds.slideWidth + "px,0,0)",
								transform: "translate3d(" + jds.slideWidth + "px,0,0)"
							});

						}

					}
					
				});
				
				jds.outerContainer.css("min-height", jds.slide.height() + jds.container.find("h2").outerHeight() + 50);

				if(settings.ajaxOn){
					jds.builder.getData();
				} else {
					jds.builder.staticBuilder();
				}
				
				// activate controls
				if(jds.slideCount > 1){
					jds.controls();
				}
				
				// auto advance
				if(jds.autoAdvance == true){
					setInterval(function(){
						if(!jds.container.hasClass("hovering")){
							jds.advance.nextSlide();	
						}
					}, 4000);
				}
				
				// listener for window resize or orientation change
				jds.helper.windowChange();

			},
			builder: {

				getData: function(){
					
					var images = [],
						text = [],
						navClick = navClick,
						slideData = null;

					$.ajax({
						url:  (window.location.host === "local.sandbox.com") ? "/jd/www/wp-admin/admin-ajax.php?action=get_package_items_ajax&id=" + jds.slideshowDataID : "/wp-admin/admin-ajax.php?action=get_package_items_ajax&id=" + jds.slideshowDataID,
						dataType: "json",
						success: function (data) {

							// set current index
							// jds.slideIndex = data.collectionItems.currentItemIndex;
							
							// build slides
							if(data.packageItems.isNested){
								
								// set number of slides
								jds.slideCount = data.packageItems.nested[0].IDs.length;

								// if slideshow is nested
								jds.builder.slides(data.packageItems.nested[0]);
								
							} else {
								
								// set number of slides
								jds.slideCount = data.packageItems.IDs.length;

								// if slideshow is not nested
								jds.builder.slides(data);
								
							}
							
							// initialize controls
							jds.controls();
							
							// process thumbnails
							// jds.thumbPagi.init();

						}, 
						error: function (e) {

							// y u no work?
							console.log("slideshow ajax error: ", e);

						}
						
					});
					
				},
				staticBuilder: function(){

					jds.slide.each(function(i){

						if($(this).find("img").length && !$(this).find(".jds-slide-details").length){

							$(this).addClass("jds-slide-img-only").attr("data-slide-index", (i + 1));
						
						} else if($(this).find(".jds-slide-details").length && !$(this).find("img").length) {
						
							$(this).addClass("jds-slide-text-only").attr("data-slide-index", (i + 1));
						
						} else {
						
							$(this).attr("data-slide-index", (i + 1));
						
						}							

						if(i === 0){
							$(this).addClass("jds-slide-first");

							if (navigator.userAgent.indexOf("MSIE") != -1){

								$(this).css({left: "0px"});

							} else {

								$(this).css({
									webkitTransform: "translate3d(0px,0,0)",
									MozTransform: "translate3d(0px,0,0)",
									transform: "translate3d(0px,0,0)"
								});

							}

						} else {

							if (navigator.userAgent.indexOf("MSIE") != -1){

								$(this).css({left: jds.slideWidth + "px"});

							} else {

								$(this).css({
									webkitTransform: "translate3d(" + jds.slideWidth + "px,0,0)",
									MozTransform: "translate3d(" + jds.slideWidth + "px,0,0)",
									transform: "translate3d(" + jds.slideWidth + "px,0,0)"
								});

							}

						}
						

					});

				},
				slides: function(slideData){
					
					var j = 0;
					
					if(slideData.packageItems != undefined){
						var data = slideData.packageItems;
					} else {
						var data = slideData;
					}

					jds.originalSlideIndex = data.currentItemIndex;
					
					(function imgLoop(i) {

						var slideText, 
							slideContain, 
							slideImage;

						// this skips building whatever slide has already been printed on load
						if (j === (jds.originalSlideIndex - 1) && jds.legacyHash == "") {

							j++;
							i--;

							if (i > 0) {
								imgLoop(i);
							} else {
								return;
							}

						// build the slides	
						} else {

							slideContain = document.createElement("div");	

							if(data.images[j][0] === undefined){
								slideImage = false;
							} else {
								slideImage = new Image();
								slideImage.src = data.images[j][0];
								// uncomment and make sure you have alt data being sent if you want to add the img alt attr
								// $(slideImage).attr("alt", data.itemAltData[j]);
							}
							
							if(data.text[j] === ""){
								slideText = false;
							} else {
								slideText = data.text[j];
							}

							if(j < (jds.originalSlideIndex - 1)){
							// if this slide order is before printed slide, position to the left

								if(slideImage && !slideText){
									$(slideContain).addClass("jds-slide jds-slide-img-only").attr("data-slide-index", (j + 1));
								} else if(slideText && !slideImage) {
									$(slideContain).addClass("jds-slide jds-slide-text-only").attr("data-slide-index", (j + 1));
								} else {
									$(slideContain).addClass("jds-slide").attr("data-slide-index", (j + 1));
								}
								
								if(slideImage){
									$(slideContain).append(slideImage);
								}
									
								if(slideText) {
									$(slideContain).append("<div class='jds-slide-details'><p>" + slideText + "</p></div>");
								}

								if (navigator.userAgent.indexOf("MSIE") != -1){								
									
									$(slideContain).css({left: -jds.slideWidth + "px"}).find(".jds-details").append();

								} else {

									$(slideContain).css({
										webkitTransform: "translate3d(" + -jds.slideWidth + "px,0,0)",
										MozTransform: "translate3d(" + -jds.slideWidth + "px,0,0)",
										transform: "translate3d(" + -jds.slideWidth + "px,0,0)"
									});

								}

							} else {
							// if this slide order is after printed slide, position to the right

								if(slideImage && !slideText){
									$(slideContain).addClass("jds-slide jds-slide-img-only").attr("data-slide-index", (j + 1));
								} else if(slideText && !slideImage) {
									$(slideContain).addClass("jds-slide jds-slide-text-only").attr("data-slide-index", (j + 1));
								} else {
									$(slideContain).addClass("jds-slide").attr("data-slide-index", (j + 1));
								}							

								if(slideImage){
									$(slideContain).append(slideImage);
								}
									
								if(slideText) {
									$(slideContain).append("<div class='jds-slide-details'><p>" + slideText + "</p></div>");
								}

								if (navigator.userAgent.indexOf("MSIE") != -1){

									$(slideContain).css({left: jds.slideWidth + "px"});

								} else {

									$(slideContain).css({
										webkitTransform: "translate3d(" + jds.slideWidth + "px,0,0)",
										MozTransform: "translate3d(" + jds.slideWidth + "px,0,0)",
										transform: "translate3d(" + jds.slideWidth + "px,0,0)"
									});

								}

							}

							// Insert before current slide
							if (j < jds.originalSlideIndex - 1 && jds.legacyHash == "") {
								jds.slides.find('.active-slide').before($(slideContain));
							// Insert after
							} else {

								if (j != 0) {
									
									jds.slides.append($(slideContain));
									
								} else {
									
									if (!$('[data-slide-index=1]').length) {
										jds.slides.append($(slideContain));
									}
									
								}

							}

							var imgLoaded = setInterval(function () {

								if (slideImage.complete) {

									j++;
									i--;
									if (i > 0) {
										imgLoop(i);
									} else {
										return;
									}
									clearInterval(imgLoaded);
								}

							}, 100);

						}

					})(jds.slideCount);

				}

			},
			advance: {
				
				nextSlide: function(){

					if(jds.slideIndex < jds.slideCount){
					// we are not at the end of the slideshow

						jds.helper.setHeight(1);

						if (navigator.userAgent.indexOf("MSIE") != -1){

							// move slides
							$("[data-slide-index=" + jds.slideIndex + "]").css({
								left: -jds.slideWidth +  "px"
							});

							jds.container.find("[data-slide-index='" + (jds.slideIndex + 1) + "']").css({
								left: "0px"
							});

						} else {

							// move slides
							jds.container.find("[data-slide-index='" + jds.slideIndex + "']").css({
								webkitTransform: "translate3d(" + -jds.slideWidth + "px,0,0)",
								webkitTransition: "-webkit-transform 200ms cubic-bezier(0,1,1,1)",
								MozTransform: "translate3d(" + -jds.slideWidth + "px,0,0)",
								MozTransition: "-moz-transform 200ms cubic-bezier(0,1,1,1)"
							});

							jds.container.find("[data-slide-index='" + (jds.slideIndex + 1) + "']").css({
								webkitTransform: "translate3d(0px,0,0)",
								webkitTransition: "-webkit-transform 200ms cubic-bezier(0,1,1,1)",
								MozTransform: "translate3d(0px,0,0)",
								MozTransition: "-moz-transform 200ms cubic-bezier(0,1,1,1)"
							});

						}
						
						jds.slideIndex++;
						
						if($(".btn-pagi").length){

							$(".btn-pagi").removeClass("active");
							$("[data-pagi-index=" + (jds.slideIndex - 1) + "]").addClass("active");

						}

					} else if (jds.slideIndex == jds.slideCount) {
					// we are at the end of the slideshow and want to loop around, forever

						// move already viewed slides to the end
						jds.container.find(".jds-slide").each(function(i){

							if(jds.slideIndex != (i + 1)){
								
								if (navigator.userAgent.indexOf("MSIE") != -1){

									// move slides
									$(this).css({
										left: jds.slideWidth +  "px"
									});

								} else {

									$(this).css({
										webkitTransform: "translate3d(" + jds.slideWidth + "px,0,0)",
										webkitTransition: "none",
										MozTransform: "translate3d(" + jds.slideWidth + "px,0,0)",
										MozTransition: "none",
										transform: "translate3d(" + jds.slideWidth + "px,0,0)",
										transition: "none"
									});

								}
								
							}
							
						});
						
						// small delay for slide shifting, probably could be more elegant
						setTimeout(function(){
						
							// reset index
							jds.slideIndex = 1;
					
							jds.helper.setHeight(0);

							if (navigator.userAgent.indexOf("MSIE") != -1){

								// move first slide in
								jds.container.find("[data-slide-index='" + jds.slideIndex + "']").css({
									left: "0px"
								});

								// move last slide out
								jds.container.find("[data-slide-index='" + jds.slideCount + "']").css({
									left: -jds.slideWidth +  "px"
								});

							} else {

								// move first slide in
								jds.container.find("[data-slide-index='" + jds.slideIndex + "']").css({
									webkitTransform: "translate3d(0px,0,0)",
									webkitTransition: "-webkit-transform 200ms cubic-bezier(0,1,1,1)",
									MozTransform: "translate3d(0px,0,0)",
									MozTransition: "-moz-transform 200ms cubic-bezier(0,1,1,1)"
								});

								// move last slide out
								jds.container.find("[data-slide-index='" + jds.slideCount + "']").css({
									webkitTransform: "translate3d(" + -jds.slideWidth + "px,0,0)",
									webkitTransition: "-webkit-transform 200ms cubic-bezier(0,1,1,1)",
									MozTransform: "translate3d(" + -jds.slideWidth + "px,0,0)",
									MozTransition: "-moz-transform 200ms cubic-bezier(0,1,1,1)"
								});

							}
						
						}, 100);
						
						// wait for animation to complete
						setTimeout(function(){
							
							if (navigator.userAgent.indexOf("MSIE") != -1){

								// move last slide to the end of the slides
								jds.container.find("[data-slide-index='" + jds.slideCount + "']").css({
									left: jds.slideWidth +  "px"
								});

							} else {
								
								// move last slide to the end of the slides
								jds.container.find("[data-slide-index='" + jds.slideCount + "']").css({
									webkitTransform: "translate3d(" + jds.slideWidth + "px,0,0)",
									webkitTransition: "none",
									MozTransform: "translate3d(" + jds.slideWidth + "px,0,0)",
									MozTransition: "none"
								});

							}
							
							if($(".btn-pagi").length){

								$(".btn-pagi").removeClass("active");
								$("[data-pagi-index=" + (jds.slideIndex - 1) + "]").addClass("active");

							}
							
						}, 300);
					
					}
					
				},
				prevSlide: function(){
				
					if(jds.slideIndex > 1){
					// we are not at the start of the slideshow

						jds.slideIndex--;
						
						jds.helper.setHeight(0);

						if (navigator.userAgent.indexOf("MSIE") != -1){

							// move slides
							jds.container.find("[data-slide-index='" + (jds.slideIndex + 1) + "']").css({
								left: -jds.slideWidth +  "px"
							});

							jds.container.find("[data-slide-index='" + jds.slideIndex + "']").css({
								left: "0px"
							});

						} else {

							// move slides
							jds.container.find("[data-slide-index='" + (jds.slideIndex + 1) + "']").css({
								webkitTransform: "translate3d(" + jds.slideWidth + "px,0,0)",
								webkitTransition: "-webkit-transform 200ms cubic-bezier(0,1,1,1)",
								MozTransform: "translate3d(" + jds.slideWidth + "px,0,0)",
								MozTransition: "-moz-transform 200ms cubic-bezier(0,1,1,1)"
							});

							jds.container.find("[data-slide-index='" + jds.slideIndex + "']").css({
								webkitTransform: "translate3d(0px,0,0)",
								webkitTransition: "-webkit-transform 200ms cubic-bezier(0,1,1,1)",
								MozTransform: "translate3d(0px,0,0)",
								MozTransition: "-moz-transform 200ms cubic-bezier(0,1,1,1)"
							});

						}
																	
						// if the index has now switched the last spot, reorder the slides
						if(jds.slideIndex == jds.slideCount){

							// wait for animation to complete
							setTimeout(function(){
								// move already viewed slides to the end
								jds.container.find(jds.slide).each(function(i){

									if(jds.slideIndex != 0){
										
										if (navigator.userAgent.indexOf("MSIE") != -1){

											// move slides
											$(this).css({
												left: -jds.slideWidth +  "px"
											});

										} else {

											$(this).css({
												webkitTransform: "translate3d(" + -jds.slideWidth + "px,0,0)",
												webkitTransition: "none",
												MozTransform: "translate3d(" + -jds.slideWidth + "px,0,0)",
												MozTransition: "none"
											});

										}
										
									}
								});
							}, 200);

						}

						if($(".btn-pagi").length){

							$(".btn-pagi").removeClass("active");
							$("[data-pagi-index=" + (jds.slideIndex - 1) + "]").addClass("active");

						}
			
					} else if (jds.slideIndex == 1) {
					// we are at the start of the slideshow and want to loop around, forever

						// move already viewed slides to the end
						jds.container.find(".jds-slide").each(function(i){

							if(jds.slideIndex != (i + 1)){
								
								if (navigator.userAgent.indexOf("MSIE") != -1){

									// move slides
									$(this).css({
										left: -jds.slideWidth +  "px"
									});

								} else {

									$(this).css({
										webkitTransform: "translate3d(" + -jds.slideWidth + "px,0,0)",
										webkitTransition: "none",
										MozTransform: "translate3d(" + -jds.slideWidth + "px,0,0)",
										MozTransition: "none"
									});

								}
								
							}
							
						});
						
						// small delay for slide shifting, probably could be more elegant
						setTimeout(function(){
						
							// reset index
							jds.slideIndex = jds.slideCount;

							jds.helper.setHeight(0);

							if (navigator.userAgent.indexOf("MSIE") != -1){

								// move last slide in
								jds.container.find("[data-slide-index='" + jds.slideIndex + "']").css({
									left: "0px"
								});
								
								// move first slide out
								jds.container.find("[data-slide-index='1']").css({
									left: -jds.slideWidth +  "px"
								});

								

							} else {
								
								// move last slide in
								jds.container.find("[data-slide-index='" + jds.slideIndex + "']").css({
									webkitTransform: "translate3d(0px,0,0)",
									webkitTransition: "-webkit-transform 200ms cubic-bezier(0,1,1,1)",
									MozTransform: "translate3d(0px,0,0)",
									MozTransition: "-moz-transform 200ms cubic-bezier(0,1,1,1)"
								});

								// move first slide out
								jds.container.find("[data-slide-index='1']").css({
									webkitTransform: "translate3d(" + jds.slideWidth + "px,0,0)",
									webkitTransition: "-webkit-transform 200ms cubic-bezier(0,1,1,1)",
									MozTransform: "translate3d(" + jds.slideWidth + "px,0,0)",
									MozTransition: "-moz-transform 200ms cubic-bezier(0,1,1,1)"
								});

							}
						
						}, 100);
						
						// wait for animation to complete
						setTimeout(function(){
							
							if (navigator.userAgent.indexOf("MSIE") != -1){

								// move last slide to the end of the slides
								jds.container.find("[data-slide-index='1']").css({
									left: -jds.slideWidth +  "px"
								});

							} else {

								// move last slide to the end of the slides
								jds.container.find("[data-slide-index='1']").css({
									webkitTransform: "translate3d(" + -jds.slideWidth + "px,0,0)",
									webkitTransition: "none",
									MozTransform: "translate3d(" + -jds.slideWidth + "px,0,0)",
									MozTransition: "none"
								});

							}
							
							if($(".btn-pagi").length){

								$(".btn-pagi").removeClass("active");
								$("[data-pagi-index=" + (jds.slideIndex - 1) + "]").addClass("active");

							}

						}, 300);
					
					}
				
				}
				
			},
			controls: function(){
				
				// next click event
				jds.container.find(jds.nextBtn).on("touchend, click", function(){
					
					jds.advance.nextSlide();
					
				});
				
				// prev click event
				jds.container.find(jds.prevBtn).on("touchend, click", function(){
			
					jds.advance.prevSlide();

				});
				
				jds.container.find(jds.expandBtn).on("touchend, click", function(){
					
					if(jds.container.hasClass("closed")){
						
						jds.container.removeClass("closed")
						jds.container.addClass("open");
						jds.container.find(".slideshow-index").text(jds.slideCount);
						$(this).text("hide");
						
					} else {
						
						jds.container.removeClass("open")
						jds.container.addClass("closed");	
						jds.container.find(".slideshow-index").text(jds.slideIndex);
						$(this).text("show all");
						
					}
					
				});
				
				jds.container.on("touchstart", function(e){

					// get original touch coords
					jds.touchOriginalX = e.originalEvent.pageX;
					jds.touchOriginalY = e.originalEvent.pageY;

				});

				jds.container.on("touchend", function(e){

					// if the user swipes to the left
					if(jds.touchOriginalX > e.originalEvent.changedTouches[0].pageX && Math.abs(jds.touchOriginalX - e.originalEvent.changedTouches[0].pageX) > 50 && Math.abs(e.originalEvent.changedTouches[0].pageY - jds.touchOriginalY) <= 15){

						jds.advance.nextSlide();
							
						return false;

					} 

					// if the user swipes to the right
					else if (jds.touchOriginalX < e.originalEvent.changedTouches[0].pageX && Math.abs(jds.touchOriginalX - e.originalEvent.changedTouches[0].pageX) > 50 && Math.abs(e.originalEvent.changedTouches[0].pageY - jds.touchOriginalY) <= 15) {
												
						jds.advance.prevSlide();

						return false;

					}

				});
				
				
				// building pagi nav, if needed
				if(jds.pagi){

					jds.pagiContain = jds.outerContainer.find("nav");
					
					for(i=0;i<jds.slideCount;i++){
									
						if(i == 0){
							jds.pagiContain.find("div").append('<a href="javascript:void(0);" class="btn-pagi active" data-pagi-index="' + i + '"></a>');
						} else {
							jds.pagiContain.find("div").append('<a href="javascript:void(0);" class="btn-pagi" data-pagi-index="' + i + '"></a>');
						}
						
					}

					jds.pagiContain.css("width", (($(".btn-pagi").outerWidth(true) * jds.slideCount) - 5) + "px");

					if($(".btn-pagi").length){
					
						jds.pagiContain.find(".btn-pagi").on("touchend, click", function(){

							// if the active pagi is clicked don't do anything
							if(jds.slideIndex === parseInt($(this).attr("data-pagi-index")) + 1){
								return;
							}

							var thumbIndex = (parseInt($(this).attr("data-pagi-index")) + 1);

							$(".active").removeClass("active");
							$(this).addClass("active");
							
							jds.helper.setHeight(0);

							if (navigator.userAgent.indexOf("MSIE") != -1){

								// move associtate thumbnav slide in
								jds.container.find("[data-slide-index='" + thumbIndex + "']").css({
									left: "0px"
								});
								
								// move current slide out
								jds.container.find("[data-slide-index='" + jds.slideIndex + "']").css({
									left: -jds.slideWidth +  "px"
								});

							} else {
								
								// move associtate thumbnav slide in
								jds.container.find("[data-slide-index='" + thumbIndex + "']").css({
									webkitTransform: "translate3d(0px,0,0)",
									webkitTransition: "-webkit-transform 200ms cubic-bezier(0,1,1,1)",
									MozTransform: "translate3d(0px,0,0)",
									MozTransition: "-moz-transform 200ms cubic-bezier(0,1,1,1)"
								});

								// move current slide out
								jds.container.find("[data-slide-index='" + jds.slideIndex + "']").css({
									webkitTransform: "translate3d(" + jds.slideWidth + "px,0,0)",
									webkitTransition: "-webkit-transform 200ms cubic-bezier(0,1,1,1)",
									MozTransform: "translate3d(" + jds.slideWidth + "px,0,0)",
									MozTransition: "-moz-transform 200ms cubic-bezier(0,1,1,1)"
								});

							}
							
							for(i = 1; i <= jds.slideCount; i++){

								if(i < thumbIndex){

									if (navigator.userAgent.indexOf("MSIE") != -1){

										jds.container.find("[data-slide-index=" + i + "]").css({
											left: -jds.slideWidth +  "px"
										});

									} else {

										jds.container.find("[data-slide-index=" + i + "]").css({
											webkitTransform: "translate3d(" + -jds.slideWidth +  "px,0,0)",
											MozTransform: "translate3d(" + -jds.slideWidth +  "px,0,0)",
											transform: "translate3d(" + -jds.slideWidth +  "px,0,0)"
										});

									}

								} else if(i > thumbIndex){

									if (navigator.userAgent.indexOf("MSIE") != -1){

										jds.container.find("[data-slide-index=" + i + "]").css({
											left: jds.slideWidth +  "px"
										});

									} else {

										jds.container.find("[data-slide-index=" + i + "]").css({
											webkitTransform: "translate3d(" + jds.slideWidth +  "px,0,0)",
											MozTransform: "translate3d(" + jds.slideWidth +  "px,0,0)",
											transform: "translate3d(" + jds.slideWidth +  "px,0,0)"
										});

									}

								}

							}

							jds.slideIndex = thumbIndex;
							
						});
				
					}
					
				}

			},
			helper: {

				setHeight: function(indexMod){

					// do height detection on each slide based on the height of the items that it contains
					var slidesHeight = null,
						indexSelector = jds.slideIndex + indexMod,
						slideSelector = $("[data-slide-index=" + indexSelector + "]"),
						slideImgHeight = slideSelector.find("img").height(),
						slideTextHeight = slideSelector.find(".jds-slide-details").height();

					// if the image has a float don't add the heights, just set which ever is taller
					if(slideSelector.find("img").css("float") === "left"){

						if(slideImgHeight > slideTextHeight){

							slidesHeight = slideImgHeight;

						} else {

							slidesHeight = slideTextHeight;

						}				

					} else {

						if(slideSelector.find("img").length){
							slidesHeight += slideSelector.find("img").height();
						}

						if(slideSelector.find(".jds-slide-details").length){
							slidesHeight +=slideSelector.find(".jds-slide-details").height();
						}

					}

					jds.slides.css("height", slidesHeight);	

				}, 
				windowChange: function(){

					var startWidth = $(window).outerWidth(),
						widthDif;

					$(window).resize(function(e){

						widthDif = startWidth - e.target.outerWidth;

						// reset timeout if a resize event happens before timer
						if(this.resizeEnd) clearTimeout(this.resizeEnd);

						// run set a new startWidth and run moveSlides if 500ms passes between resize events
						// assume the user is done resizing
						this.resizeEnd = setTimeout(function(){

							jds.slideWidth = $(".jds-slide").outerWidth();
							// startWidth = e.target.outerWidth;
							moveSlides()
							// console.log("timeout: ", startWidth, e.target.outerWidth, widthDif);

						}, 250);


					});

					function moveSlides(){

						$(".jds-slide").each(function(){

							if($(this).attr("data-slide-index") < jds.slideIndex){

								if (navigator.userAgent.indexOf("MSIE") != -1){

									$(this).css({
										left: -jds.slideWidth +  "px"
									});

								} else {

									$(this).css({
										webkitTransform: "translate3d(" + -jds.slideWidth +  "px,0,0)",
										MozTransform: "translate3d(" + -jds.slideWidth +  "px,0,0)",
										transform: "translate3d(" + -jds.slideWidth +  "px,0,0)"
									});

								}

							} else if($(this).attr("data-slide-index") > jds.slideIndex){

								if (navigator.userAgent.indexOf("MSIE") != -1){

									$(this).css({
										left: jds.slideWidth +  "px"
									});

								} else {

									$(this).css({
										webkitTransform: "translate3d(" + jds.slideWidth +  "px,0,0)",
										MozTransform: "translate3d(" + jds.slideWidth +  "px,0,0)",
										transform: "translate3d(" + jds.slideWidth +  "px,0,0)"
									});

								}

							}

						});

					}

									
				}

			}
		
		}; jds.init();

	});
	
};