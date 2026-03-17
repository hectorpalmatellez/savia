type Room = 'Living Room' | 'Bedroom' | 'Kitchen' | 'Dormitorio' | 'Balcón';

export type PlantStatus = 'Viva' | 'Débil' | 'Muerta' | null | undefined;

export interface PlantData {
  id?: string;
  common_name: string;
  scientific_name?: string;
  category?: string;
  location: Room;
  placement?: string;
  status?: PlantStatus;
  requirements: {
    light: string;
    water: string;
    humidity?: string;
    soil?: string;
  };
  care?: {
    last_watered?: Date;
    last_fertilized?: Date;
  };
  image?: string;
}

export const PLANT_DATA: Record<string, PlantData> = {
  'monstera-1': {
    common_name: 'Monstera',
    scientific_name: 'Monstera deliciosa',
    location: 'Living Room',
    placement: 'Near the balcony door',
    requirements: {
      light: 'Bright Indirect',
      water: 'Weekly',
      humidity: '60%+',
    },
    care: { last_watered: new Date('2026-03-10') },
    image: '/images/monstera.jpg',
  },
  'snake-plant-01': {
    common_name: 'Snake Plant',
    location: 'Bedroom',
    requirements: { light: 'Low', water: 'Every 3 weeks' },
    // Notice scientific_name and care are missing here - the UI will handle it!
  },
};
