export interface PotholeDetectionResult {
  hasPothole: boolean;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export class PotholeDetectionService {
  private apiEndpoint: string;

  constructor(apiEndpoint: string = '') {
    this.apiEndpoint = apiEndpoint;
  }

  async detectPothole(imageData: string): Promise<PotholeDetectionResult> {
    if (!this.apiEndpoint) {
      return this.mockDetection();
    }

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
        }),
      });

      if (!response.ok) {
        throw new Error('Detection API failed');
      }

      const data = await response.json();

      return {
        hasPothole: data.hasPothole || false,
        confidence: data.confidence || 0,
        boundingBox: data.boundingBox,
      };
    } catch (error) {
      console.error('Pothole detection error:', error);
      return this.mockDetection();
    }
  }

  private mockDetection(): PotholeDetectionResult {
    const random = Math.random();
    return {
      hasPothole: random > 0.85,
      confidence: random > 0.85 ? 0.7 + Math.random() * 0.3 : 0.2 + Math.random() * 0.3,
      boundingBox: random > 0.85 ? {
        x: Math.random() * 0.5,
        y: Math.random() * 0.5,
        width: 0.1 + Math.random() * 0.2,
        height: 0.1 + Math.random() * 0.2,
      } : undefined,
    };
  }

  setApiEndpoint(endpoint: string) {
    this.apiEndpoint = endpoint;
  }
}

export const potholeDetectionService = new PotholeDetectionService();
