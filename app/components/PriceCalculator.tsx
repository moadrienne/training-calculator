"use client"

import React, { useState } from 'react';
import { Download, Plus, Trash2 } from 'lucide-react';

type TrainerRole = 'lead' | 'trainer' | 'apprentice';
type TrainerLocation = 'local' | 'traveling';

interface TravelDetails {
  needsFlight: boolean;
  flightCost: number;
  lodgingNights: number;
  lodgingCostPerNight: number;
  mileageCost: number;
  mealAllowance: number;
  otherExpenses: number;
}

interface Trainer {
  id: number;
  role: TrainerRole;
  count: number;
  location: TrainerLocation;
  travelDetails: TravelDetails;
}

const PriceCalculator = () => {
  const [trainingType, setTrainingType] = useState<'in-person' | 'virtual'>('in-person');
  const [duration, setDuration] = useState<string>('60');
  const [trainers, setTrainers] = useState<Trainer[]>([
    { 
      id: 1, 
      role: 'lead', 
      count: 1, 
      location: 'local',
      travelDetails: {
        needsFlight: false,
        flightCost: 400,
        lodgingNights: 0,
        lodgingCostPerNight: 150,
        mileageCost: 0,
        mealAllowance: 0,
        otherExpenses: 0
      }
    }
  ]);
  const [pmHours, setPmHours] = useState<number>(0);

  const PM_RATE = 125;
  const ADMIN_PERCENTAGE = 0.30;
  const MILEAGE_RATE = 0.67; // IRS standard mileage rate
  const MEAL_ALLOWANCE_PER_DAY = 75; // Standard meal allowance

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

  const addTrainer = (): void => {
    const newId = Math.max(...trainers.map(t => t.id)) + 1;
    setTrainers([...trainers, { 
      id: newId, 
      role: 'trainer', 
      count: 1, 
      location: 'local',
      travelDetails: {
        needsFlight: false,
        flightCost: 400,
        lodgingNights: 0,
        lodgingCostPerNight: 150,
        mileageCost: 0,
        mealAllowance: 0,
        otherExpenses: 0
      }
    }]);
  };

  const removeTrainer = (id: number): void => {
    if (trainers.length > 1) {
      setTrainers(trainers.filter(t => t.id !== id));
    }
  };

  const updateTrainer = (id: number, field: keyof Trainer, value: string | number): void => {
    setTrainers(trainers.map(t => 
      t.id === id ? { 
        ...t, 
        [field]: field === 'role' ? value as TrainerRole : 
                field === 'location' ? value as TrainerLocation : 
                value 
      } : t
    ));
  };

  const updateTravelDetails = (id: number, field: keyof TravelDetails, value: string | number | boolean): void => {
    setTrainers(trainers.map(t => 
      t.id === id ? { 
        ...t, 
        travelDetails: {
          ...t.travelDetails,
          [field]: value
        }
      } : t
    ));
  };

  const calculateTrainerTravelCost = (trainer: Trainer): number => {
    if (trainer.location === 'local' || trainingType === 'virtual') return 0;
    
    const { needsFlight, flightCost, lodgingNights, lodgingCostPerNight, mileageCost, mealAllowance, otherExpenses } = trainer.travelDetails;
    
    const flightTotal = needsFlight ? flightCost : 0;
    const lodgingTotal = lodgingNights * lodgingCostPerNight;
    const mealTotal = mealAllowance;
    
    return (flightTotal + lodgingTotal + mileageCost + mealTotal + otherExpenses) * trainer.count;
  };

  const calculatePrices = () => {
    const trainersCost = trainers.reduce((sum, trainer) => {
      const rate = pricing[trainingType][duration][trainer.role];
      return sum + (rate * trainer.count);
    }, 0);

    // Calculate travel costs for each traveling trainer based on their detailed travel breakdown
    const travelPrice = trainers.reduce((sum, trainer) => {
      return sum + calculateTrainerTravelCost(trainer);
    }, 0);
    
    const travelingTrainersCount = trainingType === 'in-person' ? 
      trainers.reduce((sum, trainer) => {
        return trainer.location === 'traveling' ? sum + trainer.count : sum;
      }, 0) : 0;
    
    const pmCost = pmHours * PM_RATE;
    const subtotal = trainersCost + travelPrice + pmCost;
    const adminCost = subtotal * ADMIN_PERCENTAGE;
    const total = subtotal + adminCost;

    return {
      trainersCost,
      travelPrice,
      travelingTrainersCount,
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
    const locationLabels: Record<TrainerLocation, string> = {
      local: 'Local',
      traveling: 'Traveling'
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
        `${roleLabels[t.role]} - ${locationLabels[t.location]}${t.location === 'traveling' ? ` (${t.travelType})` : ''} (${t.count})`,
        `Training: ${(pricing[trainingType][duration][t.role] * t.count).toLocaleString()}${
          trainingType === 'in-person' && t.location === 'traveling' 
            ? ` | Travel: ${(travelFees[t.travelType] * t.count).toLocaleString()}` 
            : ''
        }`
      ]),
      [''],
      ['Project Management Hours', pmHours.toString()],
      [''],
      ['Cost Breakdown'],
      ['Total Training Fees', `${prices.trainersCost.toLocaleString()}`],
      trainingType === 'in-person' && prices.travelingTrainersCount > 0 ? 
        ['Total Travel Fees', `${prices.travelPrice.toLocaleString()}`] : [],
      ['Project Management', `${prices.pmCost.toLocaleString()}`],
      ['Subtotal', `${prices.subtotal.toLocaleString()}`],
      ['Administrative Cost (30%)', `${prices.adminCost.toLocaleString()}`],
      [''],
      ['Total', `${prices.total.toLocaleString()}`],
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
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 border text-black">
      <div className="flex justify-between items-center mb-8 border-b pb-6">
        <h1 className="text-3xl font-light tracking-tight text-black">Price Calculator</h1>
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
          <label className="block text-sm font-medium uppercase tracking-wide text-black">Training Type</label>
          <div className="flex space-x-6">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-black focus:ring-black"
                checked={trainingType === 'in-person'}
                onChange={() => setTrainingType('in-person')}
              />
              <span className="ml-2 text-black">In Person</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-black focus:ring-black"
                checked={trainingType === 'virtual'}
                onChange={() => setTrainingType('virtual')}
              />
              <span className="ml-2 text-black">Virtual</span>
            </label>
          </div>
        </div>

        {/* Duration Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium uppercase tracking-wide text-black">Duration</label>
          <select 
            className="w-full rounded-md border p-3 focus:ring-2 focus:ring-black focus:border-black transition-colors text-black"
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
            <label className="block text-sm font-medium uppercase tracking-wide text-black">Trainers</label>
            <button 
              onClick={addTrainer}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded hover:bg-black hover:text-white transition-colors text-sm border text-black"
            >
              <Plus className="w-4 h-4" />
              Add Trainer
            </button>
          </div>
          
          {trainers.map((trainer) => (
            <div key={trainer.id} className="space-y-4 p-4 bg-white rounded-lg border text-black">
              {/* Main trainer info row */}
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="block text-sm font-medium text-black">Role</label>
                  <select 
                    className="w-full rounded-md border p-2 focus:ring-2 focus:ring-black focus:border-black text-black"
                    value={trainer.role}
                    onChange={(e) => updateTrainer(trainer.id, 'role', e.target.value)}
                  >
                    <option value="lead">Lead Trainer</option>
                    <option value="trainer">Trainer</option>
                    <option value="apprentice">Apprentice</option>
                  </select>
                </div>

                {/* Location Selection - only show for in-person training */}
                {trainingType === 'in-person' && (
                  <div className="flex-1 space-y-2">
                    <label className="block text-sm font-medium text-black">Location</label>
                    <select 
                      className="w-full rounded-md border p-2 focus:ring-2 focus:ring-black focus:border-black text-black"
                      value={trainer.location}
                      onChange={(e) => updateTrainer(trainer.id, 'location', e.target.value)}
                    >
                      <option value="local">Local</option>
                      <option value="traveling">Traveling</option>
                    </select>
                  </div>
                )}
                
                <div className="w-24 space-y-2">
                  <label className="block text-sm font-medium text-black">Count</label>
                  <input
                    type="number"
                    min="1"
                    value={trainer.count}
                    onChange={(e) => updateTrainer(trainer.id, 'count', parseInt(e.target.value) || 1)}
                    className="w-full rounded-md border p-2 focus:ring-2 focus:ring-black focus:border-black text-black"
                  />
                </div>

                {trainers.length > 1 && (
                  <button
                    onClick={() => removeTrainer(trainer.id)}
                    className="text-black hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Travel Details - only show for traveling trainers in in-person training */}
              {trainingType === 'in-person' && trainer.location === 'traveling' && (
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <h4 className="text-sm font-semibold text-black mb-3">Travel Details (per person)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Flight */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`flight-${trainer.id}`}
                          checked={trainer.travelDetails.needsFlight}
                          onChange={(e) => updateTravelDetails(trainer.id, 'needsFlight', e.target.checked)}
                          className="rounded"
                        />
                        <label htmlFor={`flight-${trainer.id}`} className="text-sm font-medium text-black">Needs Flight</label>
                      </div>
                      {trainer.travelDetails.needsFlight && (
                        <input
                          type="number"
                          placeholder="Flight cost"
                          value={trainer.travelDetails.flightCost}
                          onChange={(e) => updateTravelDetails(trainer.id, 'flightCost', parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border p-2 focus:ring-2 focus:ring-black focus:border-black text-black text-sm"
                        />
                      )}
                    </div>

                    {/* Lodging */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-black">Lodging Nights</label>
                      <input
                        type="number"
                        min="0"
                        value={trainer.travelDetails.lodgingNights}
                        onChange={(e) => updateTravelDetails(trainer.id, 'lodgingNights', parseInt(e.target.value) || 0)}
                        className="w-full rounded-md border p-2 focus:ring-2 focus:ring-black focus:border-black text-black text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-black">Cost per Night</label>
                      <input
                        type="number"
                        placeholder="150"
                        value={trainer.travelDetails.lodgingCostPerNight}
                        onChange={(e) => updateTravelDetails(trainer.id, 'lodgingCostPerNight', parseFloat(e.target.value) || 0)}
                        className="w-full rounded-md border p-2 focus:ring-2 focus:ring-black focus:border-black text-black text-sm"
                      />
                    </div>

                    {/* Mileage */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-black">Mileage Cost</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={trainer.travelDetails.mileageCost}
                        onChange={(e) => updateTravelDetails(trainer.id, 'mileageCost', parseFloat(e.target.value) || 0)}
                        className="w-full rounded-md border p-2 focus:ring-2 focus:ring-black focus:border-black text-black text-sm"
                      />
                      <p className="text-xs text-gray-600">Or use ${MILEAGE_RATE}/mile rate</p>
                    </div>

                    {/* Meals */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-black">Meal Allowance</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={trainer.travelDetails.mealAllowance}
                        onChange={(e) => updateTravelDetails(trainer.id, 'mealAllowance', parseFloat(e.target.value) || 0)}
                        className="w-full rounded-md border p-2 focus:ring-2 focus:ring-black focus:border-black text-black text-sm"
                      />
                      <p className="text-xs text-gray-600">Suggested: ${MEAL_ALLOWANCE_PER_DAY}/day</p>
                    </div>

                    {/* Other Expenses */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-black">Other Expenses</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={trainer.travelDetails.otherExpenses}
                        onChange={(e) => updateTravelDetails(trainer.id, 'otherExpenses', parseFloat(e.target.value) || 0)}
                        className="w-full rounded-md border p-2 focus:ring-2 focus:ring-black focus:border-black text-black text-sm"
                      />
                      <p className="text-xs text-gray-600">Parking, taxi, etc.</p>
                    </div>
                  </div>

                  {/* Travel cost preview */}
                  <div className="mt-3 p-2 bg-white rounded border">
                    <span className="text-sm font-medium text-black">
                      Travel Cost per Person: ${calculateTrainerTravelCost({...trainer, count: 1}).toLocaleString()}
                      {trainer.count > 1 && (
                        <span className="text-gray-600"> × {trainer.count} = ${calculateTrainerTravelCost(trainer).toLocaleString()}</span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Project Management Hours */}
        <div className="space-y-3">
          <label className="block text-sm font-medium uppercase tracking-wide text-black">Project Management Hours</label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={pmHours}
            onChange={(e) => setPmHours(parseFloat(e.target.value) || 0)}
            className="w-full rounded-md border p-3 focus:ring-2 focus:ring-black focus:border-black text-black"
            placeholder="Enter PM hours"
          />
          <p className="text-sm text-black">Rate: ${PM_RATE}/hour</p>
        </div>

        {/* Price Breakdown */}
        <div className="mt-8 bg-white rounded-lg p-6 border text-black">
          <div className="space-y-4">
            {/* Trainer Fees Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-black border-b pb-1">Trainer Fees</h3>
              {trainers.map((trainer) => (
                <div key={trainer.id} className="flex justify-between text-sm pl-2">
                  <span className="text-black">
                    {trainer.role.charAt(0).toUpperCase() + trainer.role.slice(1)}
                    {trainingType === 'in-person' && ` (${trainer.location})`}
                    {trainer.count > 1 ? ` (${trainer.count}x)` : ''}:
                  </span>
                  <span className="font-medium text-black">
                    ${(pricing[trainingType][duration][trainer.role] * trainer.count).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-medium border-t pt-2 pl-2">
                <span className="text-black">Total Trainer Fees:</span>
                <span className="text-black">${calculatePrices().trainersCost.toLocaleString()}</span>
              </div>
            </div>

            {/* Travel Costs Section - only show if there are traveling trainers */}
            {trainingType === 'in-person' && calculatePrices().travelingTrainersCount > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-black border-b pb-1">Travel Costs (Estimated)</h3>
                {trainers
                  .filter(trainer => trainer.location === 'traveling')
                  .map((trainer) => {
                    const travelCost = calculateTrainerTravelCost(trainer);
                    const details = trainer.travelDetails;
                    return (
                      <div key={`travel-${trainer.id}`} className="pl-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-black font-medium">
                            {trainer.role.charAt(0).toUpperCase() + trainer.role.slice(1)}
                            {trainer.count > 1 ? ` (${trainer.count}x)` : ''}:
                          </span>
                          <span className="font-medium text-black">
                            ${travelCost.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 ml-4">
                          {details.needsFlight && `Flight: ${details.flightCost * trainer.count} • `}
                          {details.lodgingNights > 0 && `Lodging: ${details.lodgingNights} nights × ${details.lodgingCostPerNight} × ${trainer.count} • `}
                          {details.mileageCost > 0 && `Mileage: ${details.mileageCost * trainer.count} • `}
                          {details.mealAllowance > 0 && `Meals: ${details.mealAllowance * trainer.count} • `}
                          {details.otherExpenses > 0 && `Other: ${details.otherExpenses * trainer.count}`}
                        </div>
                      </div>
                    );
                  })}
                <div className="flex justify-between text-sm font-medium border-t pt-2 pl-2">
                  <span className="text-black">Total Travel Costs:</span>
                  <span className="text-black">${calculatePrices().travelPrice.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Project Management Section */}
            {pmHours > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-black border-b pb-1">Project Management</h3>
                <div className="flex justify-between text-sm pl-2">
                  <span className="text-black">PM Hours ({pmHours} × ${PM_RATE}):</span>
                  <span className="font-medium text-black">${calculatePrices().pmCost.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Summary Section */}
            <div className="space-y-2 pt-3 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-black">Subtotal:</span>
                <span className="font-medium text-black">${calculatePrices().subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm bg-gray-50 p-2 rounded border">
                <span className="text-black">Administrative Cost (30%):</span>
                <span className="font-medium text-black">${calculatePrices().adminCost.toLocaleString()}</span>
              </div>

              <div className="flex justify-between pt-3 border-t text-lg">
                <span className="font-medium text-black">Total:</span>
                <span className="font-bold text-black">${calculatePrices().total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceCalculator;
