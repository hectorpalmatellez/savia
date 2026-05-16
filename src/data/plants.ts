type Room = 'Living Room' | 'Bedroom' | 'Kitchen' | 'Dormitorio' | 'Balcón';

export type PlantStatus = 'Viva' | 'Débil' | 'Muerta' | null | undefined;

export interface PlantData {
  id?: string;
  row?: number;
  common_name: string;
  scientific_name?: string;
  category?: string;
  type?: string;
  location: Room;
  placement?: string;
  origin?: string;
  price?: string;
  purchase_date?: Date;
  status?: PlantStatus;
  image?: string;
  sensor?: boolean;
}

export const PLANT_DATA: Record<string, PlantData> = {
  'monstera-1': {
    common_name: 'Monstera',
    scientific_name: 'Monstera deliciosa',
    location: 'Living Room',
    placement: 'Near the balcony door',
    image: '/images/monstera.jpg',
  },
  'snake-plant-01': {
    common_name: 'Snake Plant',
    location: 'Bedroom',
    // Notice scientific_name is missing here - the UI will handle it!
  },
};
