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
