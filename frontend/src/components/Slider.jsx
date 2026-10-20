import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

export default function CyberSlider() {
  const slides = [
    {
      id: 1,
      buttonText: "اكتشف المزيد",
      link: "/services",
      image: "/images/sliders/slider1.jpg",
    },
    {
      id: 2,
      buttonText: "ابدأ التدريب",
      link: "/training",
      image: "/images/sliders/slider2.jpg",
    },
    {
      id: 3,
      buttonText: "تواصل معنا",
      link: "/contact",
      image: "/images/sliders/slider3.jpg",
    }
  ];

  return (
    <div dir="rtl" >
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={20}
        slidesPerView={1}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
        pagination={{ clickable: true }}
        navigation={true}
        loop={true}
        style={{
          "--swiper-pagination-color": "#17a2b8",
          "--swiper-navigation-color": "#17a2b8",
          width: "100%",
           
          overflow: "hidden",
          boxShadow: "0 0 25px rgba(23, 162, 184, 0.2)"
        }}
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div
              style={{
                position: "relative",
                backgroundImage: `url(${slide.image})`,
                // Changed from "cover" to "contain" so the full image displays
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center", // Ensures the image is centered and covers the area
                backgroundColor: "#070f1e", // Background color to fill any empty side gaps neatly
                width: "100%",
                height: "400px", // Fixed height for the slider
                textAlign: "right",
                color: "#ffffff",
               
                minHeight: "450px", // Increased height slightly to accommodate full image views
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-start",
              }}
            >
              {/* Action Button positioned at the bottom-left corner */}
               <a

                href={slide.link}

                style={{

                  position: "absolute",

                  bottom: "25px",

                  left: "25px",

                  padding: "10px 30px",

                  color: "rgb(255, 255, 255)",

                  border: "none",

                  borderRadius: "6px",

                  fontWeight: "bold",

                  textDecoration: "none",

                  cursor: "pointer",

                  boxShadow: "0 0 10px rgba(255, 255, 255, 0.4)"

                }}

              >
                {slide.buttonText}
              </a>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}