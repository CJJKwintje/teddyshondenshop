import { Truck, Timer, MessageCircleHeart } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function BenefitsBar() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const benefits = [
    {
      icon: <Truck size={18} />,
      text: <span className="text-xs"><span className="font-bold">Gratis verzending</span> vanaf €59</span>
    },
    {
      icon: <Timer size={18} />,
      text: <span className="text-xs">Voor 17:00 besteld, dezelfde dag verzonden</span>
    },
    {
      icon: <MessageCircleHeart size={18} />,
      text: <span className="text-xs">Vragen? Wij helpen graag!</span>
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % benefits.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gray-100 text-black">
      <div className="container mx-auto px-4">
        {/* Desktop version */}
        <div className="hidden md:flex justify-between items-center py-1">
          <div className="flex-1" />
          <div className="flex items-center gap-12">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2">
                {benefit.icon}
                {benefit.text}
              </div>
            ))}
          </div>
          <div className="flex-1 flex justify-end">
            <a
              href="https://www.webwinkelkeur.nl/webshop/Teddys-hondenshop_1222114"
              className="webwinkelkeurPopup"
              title="Trustmark webshop"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://dashboard.webwinkelkeur.nl/banners/70/1222114/1740220852000.svg"
                width="90"
                height="34"
                alt="Trustmark webshop"
                className="h-8 w-auto"
              />
            </a>
          </div>
        </div>

        {/* Mobile version */}
        <div className="md:hidden py-2">
          <div className="flex items-center justify-center gap-2">
            {benefits[currentSlide].icon}
            {benefits[currentSlide].text}
          </div>
        </div>
      </div>
    </div>
  );
}
