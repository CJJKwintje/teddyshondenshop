import { Truck, Timer, MessageCircleHeart } from 'lucide-react';

export default function BenefitsBar() {
  return (
    <div className="bg-gray-100 text-black">
      <div className="container mx-auto px-4">
        <div className="hidden md:flex justify-between items-center py-1">
          <div className="flex-1" />
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-2">
              <Truck size={18} />
              <span className="text-xs"><span className="font-bold">Gratis verzending</span> vanaf €59</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer size={18} />
              <span className="text-xs">Voor 17:00 besteld, dezelfde dag verzonden</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircleHeart size={18} />
              <span className="text-xs">Vragen? Wij helpen graag!</span>
            </div>
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
      </div>
    </div>
  );
}
