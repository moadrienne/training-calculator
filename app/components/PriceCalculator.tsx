"use client"

import React, { useState } from 'react';
import { Download, Plus, Trash2 } from 'lucide-react';

type TrainerRole = 'lead' | 'trainer' | 'apprentice';
type TravelTimeType = 'Local' | 'Half day' | 'Full day' | 'Extended' | 'N/A';

interface Trainer {
  id: number;
  role: TrainerRole;
  count: number;
}

const PriceCalculator = () => {
  const [trainingType, setTrainingType] = useState<'in-person' | 'virtual'>('in-person');
  const [duration, setDuration] = useState<string>('60');
  const [trainers, setTrainers] = useState<Trainer[]>([
    { id: 1, role: 'lead', count: 1 }
  ]);
  const [travelTime, setTravelTime] = useState<TravelTimeType>('Local');
  const [pmHours, setPmHours] = useState<number>(0);

  const PM_RATE = 125;
  const ADMIN_PERCENTAGE = 0.30;

  const pricing: Record<string, Record<string, Record<TrainerRole, number>>> = {
    'in-person': {
      '60': { lead: 500, trainer: 350, apprentice: 150 },
      '90': { lead: 750, trainer: 500, apprentice: 200 },
      '240': { lead: 1000, trainer: 750, apprentice: 300 },
      '480': { lead: 1500, trainer: 1000, apprentice: 400 }
    },
    'virtual': {
      '60': { lead: 300, trainer: 210, apprentice: 90 },
      '90': { lead: 450, trainer: 300, apprentice: 120 },
      '240': { lead: 600, trainer: 450, apprentice: 180 },
      '480': { lead: 900, trainer: 600, apprentice: 240 }
    }
  };

  const travelFees: Record<TravelTimeType, number> = {
    'Local': 100,
    'Half day': 300,
    'Full day': 600,
    'Extended': 800,
    'N/A': 0
  };

  const addTrainer = (): void => {
    const newId = Math.max(...trainers.map(t => t.id)) + 1;
    setTrainers([...trainers, { id: newId, role: 'trainer', count: 1 }]);
  };

  const removeTrainer = (id: number): void => {
    if (trainers.length > 1) {
      setTrainers(trainers.filter(t => t.id !== id));
    }
  };

  const updateTrainer = (id: number, field: keyof Trainer, value: string | number): void => {
    setTrainers(trainers.map(t => 
      t.id === id ? { ...t, [field]: field === 'role' ? value as TrainerRole : value } : t
    ));
  };

  const calculatePrices = () => {
    const trainersCost = trainers.reduce((sum, trainer) => {
      const rate = pricing[trainingType][duration][trainer.role];
      return sum + (rate * trainer.count);
    }, 0);

    const travelPrice = trainingType === 'in-person' ? 
      travelFees[travelTime] * trainers.reduce((sum, t) => sum + t.count, 0) : 0;
    
    const pmCost = pmHours * PM_RATE;
    const subtotal = trainersCost + travelPrice + pmCost;
    const adminCost = subtotal * ADMIN_PERCENTAGE;
    const total = subtotal + adminCost;

    return {
      trainersCost,
      travelPrice,
      pmCost,
      subtotal,
      adminCost,
      total
    };
  };

  const getDurationLabel = (mins: string): string => {
    switch(mins) {
      case '60': return '60 minutes';
      case '90': return '90 minutes';
      case '240': return '2-4 hours';
      case '480': return '5-8 hours';
      default: return mins + ' minutes';
    }
  };

  const exportToCSV = (): void => {
    const prices = calculatePrices();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const roleLabels: Record<TrainerRole, string> = {
      lead: 'Lead Trainer',
      trainer: 'Trainer',
      apprentice: 'Apprentice'
    };

    const data = [
      ['Training Price Calculation', ''],
      ['Generated on', new Date().toLocaleString()],
      [''],
      ['Parameters'],
      ['Training Type', trainingType === 'in-person' ? 'In Person' : 'Virtual'],
      ['Duration', getDurationLabel(duration)],
      [''],
      ['Trainers'],
      ...trainers.map((t) => [
        `${roleLabels[t.role]} (${t.count})`,
        `$${(pricing[trainingType][duration][t.role] * t.count).toLocaleString()}`
      ]),
      [''],
      trainingType === 'in-person' ? ['Travel Time', travelTime] : [],
      ['Project Management Hours', pmHours.toString()],
      [''],
      ['Cost Breakdown'],
      ['Total Training Fees', `$${prices.trainersCost.toLocaleString()}`],
      trainingType === 'in-person' ? ['Total Travel Fees', `$${prices.travelPrice.toLocaleString()}`] : [],
      ['Project Management', `$${prices.pmCost.toLocaleString()}`],
      ['Subtotal', `$${prices.subtotal.toLocaleString()}`],
      ['Administrative Cost (30%)', `$${prices.adminCost.toLocaleString()}`],
      [''],
      ['Total', `$${prices.total.toLocaleString()}`],
    ].filter(row => row.length > 0);

    const csvContent = data
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `training-quote-${timestamp}.csv`;
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 border">
      <div className="flex justify-between items-center mb-8 border-b pb-6">
        <h1 className="text-3xl font-light tracking-tight">Price Calculator</h1>
        <button 
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded hover:bg-black transition-colors"
        >
          <Download className="w-4 h-4" />
          Export to CSV
        </button>
      </div>

      <div className="space-y-8">
        {/* Training Type Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium uppercase tracking-wide">Training Type</label>
          <div className="flex space-x-6">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-black focus:ring-black"
                checked={trainingType === 'in-person'}
                onChange={() => setTrainingType('in-person')}
              />
              <span className="ml-2">In Person</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-black focus:ring-black"
                checked={trainingType === 'virtual'}
                onChange={() => setTrainingType('virtual')}
              />
              <span className="ml-2">Virtual</span>
            </label>
          </div>
        </div>

        {/* Duration Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium uppercase tracking-wide">Duration</label>
          <select 
            className="w-full rounded-md border p-3 focus:ring-2 focus:ring-black focus:border-black transition-colors"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            <option value="60">60 minutes</option>
            <option value="90">90 minutes</option>
            <option value="240">2-4 hours</option>
            <option value="480">5-8 hours</option>
          </select>
        </div>

        {/* Trainers Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium uppercase tracking-wide">Trainers</label>
            <button 
              onClick={addTrainer}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded hover:bg-black hover:text-white transition-colors text-sm border"
            >
              <Plus className="w-4 h-4" />
              Add Trainer
            </button>
          </div>
          
          {trainers.map((trainer) => (
            <div key={trainer.id} className="flex gap-4 items-end p-4 bg-white rounded-lg border">
              <div className="flex-1 space-y-2">
                <label className="block text-sm font-medium">Role</label>
                <select 
                  className="w-full rounded-md border p-2 focus:ring-2 focus:ring-black focus:border-black"
                  value={trainer.role}
                  onChange={(e) => updateTrainer(trainer.id, 'role', e.target.value)}
                >
                  <option value="lead">Lead Trainer</option>
                  <option value="trainer">Trainer</option>
                  <option value="apprentice">Apprentice</option>
                </select>
              </div>
              
              <div className="w-24 space-y-2">
                <label className="block text-sm font-medium">Count</label>
                <input
                  type="number"
                  min="1"
                  value={trainer.count}
                  onChange={(e) => updateTrainer(trainer.id, 'count', parseInt(e.target.value) || 1)}
                  className="w-full rounded-md border p-2 focus:ring-2 focus:ring-black focus:border-black"
                />
              </div>

              {trainers.length > 1 && (
                <button
                  onClick={() => removeTrainer(trainer.id)}
                  className="hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Travel Time Selection */}
        {trainingType === 'in-person' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium uppercase tracking-wide">Travel Time (per person)</label>
            <select 
              className="w-full rounded-md border p-3 focus:ring-2 focus:ring-black focus:border-black"
              value={travelTime}
              onChange={(e) => setTravelTime(e.target.value as TravelTimeType)}
            >
              <option value="Local">Local</option>
              <option value="Half day">Half Day</option>
              <option value="Full day">Full Day</option>
              <option value="Extended">Extended</option>
              <option value="N/A">N/A</option>
            </select>
          </div>
        )}

        {/* Project Management Hours */}
        <div className="space-y-3">
          <label className="block text-sm font-medium uppercase tracking-wide">Project Management Hours</label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={pmHours}
            onChange={(e) => setPmHours(parseFloat(e.target.value) || 0)}
            className="w-full rounded-md border p-3 focus:ring-2 focus:ring-black focus:border-black"
            placeholder="Enter PM hours"
          />
          <p className="text-sm">Rate: ${PM_RATE}/hour</p>
        </div>

        {/* Price Breakdown */}
        <div className="mt-8 bg-white rounded-lg p-6 border">
          <div className="space-y-3">
            {trainers.map((trainer) => (
              <div key={trainer.id} className="flex justify-between text-sm">
                <span>
                  {trainer.role.charAt(0).toUpperCase() + trainer.role.slice(1)}
                  {trainer.count > 1 ? ` (${trainer.count}x)` : ''}:
                </span>
                <span className="font-medium">
                  ${(pricing[trainingType][duration][trainer.role] * trainer.count).toLocaleString()}
                </span>
              </div>
            ))}

            {trainingType === 'in-person' && (
              <div className="flex justify-between text-sm">
                <span>Travel Fees ({trainers.reduce((sum, t) => sum + t.count, 0)} people):</span>
                <span className="font-medium">${calculatePrices().travelPrice.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span>Project Management ({pmHours} hours):</span>
              <span className="font-medium">${calculatePrices().pmCost.toLocaleString()}</span>
            </div>

            <div className="flex justify-between pt-3 border-t text-sm">
              <span>Subtotal:</span>
              <span className="font-medium">${calculatePrices().subtotal.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-sm bg-white p-2 rounded border">
              <span>Administrative Cost (30%):</span>
              <span className="font-medium">${calculatePrices().adminCost.toLocaleString()}</span>
            </div>

            <div className="flex justify-between pt-3 border-t text-lg">
              <span className="font-medium">Total:</span>
              <span className="font-bold">${calculatePrices().total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceCalculator;