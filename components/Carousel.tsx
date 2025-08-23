
import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';

interface CarouselProps {
  children: React.ReactNode[];
}

export const Carousel: React.FC<CarouselProps> = ({ children }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalSlides = React.Children.count(children);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? totalSlides - 1 : prevIndex - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === totalSlides - 1 ? 0 : prevIndex + 1));
  };

  return (
    <div className="relative w-full">
      <div className="overflow-hidden glass-panel">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {React.Children.map(children, (child) => (
            <div className="flex-shrink-0 w-full">{child}</div>
          ))}
        </div>
      </div>
      
      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
        <button
          onClick={goToPrevious}
          className="glass-button rounded-full h-10 w-10 flex items-center justify-center pointer-events-auto"
          aria-label="Previous slide"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <button
          onClick={goToNext}
          className="glass-button rounded-full h-10 w-10 flex items-center justify-center pointer-events-auto"
          aria-label="Next slide"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="text-center mt-4">
        <span className="text-sm font-medium">
          {currentIndex + 1} / {totalSlides}
        </span>
      </div>
    </div>
  );
};
