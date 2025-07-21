// Storage interface for the German level assessment quiz
// This project uses stateless quiz functionality without user persistence

export interface IStorage {
  // No storage methods needed for quiz functionality
  // Quiz questions are static and feedback is generated real-time
}

export class MemStorage implements IStorage {
  constructor() {
    // No data storage needed for quiz application
  }
}

export const storage = new MemStorage();
