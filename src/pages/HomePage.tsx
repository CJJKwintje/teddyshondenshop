import React from 'react';
import ProductGrid from '../components/ProductGrid';
import { Dog, Cat, Bird, Fish } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <main className="container mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Happy Huisdier</h1>
        <p className="text-lg text-gray-600">Premium producten voor jouw huisdier</p>
      </header>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Categorieën</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Dog, label: 'Honden', color: 'bg-blue-500' },
            { icon: Cat, label: 'Katten', color: 'bg-purple-500' },
            { icon: Bird, label: 'Vogels', color: 'bg-green-500' },
            { icon: Fish, label: 'Vissen', color: 'bg-cyan-500' },
          ].map(({ icon: Icon, label, color }) => (
            <button
              key={label}
              className={`${color} text-white p-6 rounded-lg shadow-lg hover:opacity-90 transition-opacity`}
            >
              <div className="flex flex-col items-center gap-2">
                <Icon size={32} />
                <span className="font-medium">{label}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <ProductGrid />
    </main>
  );
};

export default HomePage;