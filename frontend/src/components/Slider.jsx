import React from "react";
import { Link } from "react-router-dom";
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
      link: "/training", // سنربط هذا الاختبار بصفحة التدريب أو مسار مخصص
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
    <div dir="rtl">
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
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                backgroundColor: "#070f1e",
                width: "100%",
                height: "400px",
                textAlign: "right",
                color: "#ffffff",
                minHeight: "450px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-start",
              }}
            >
              <Link
                to={slide.link}
                style={{
                  position: "absolute",
                  bottom: "25px",
                  left: "25px",
                  padding: "10px 30px",
                  backgroundColor: "#17a2b8",
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
              </Link>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}