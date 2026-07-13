import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, TrendingUp, Thermometer, BrainCircuit } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { toast } from 'sonner';

export default function Forecast() {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState('');
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/stations').then(res => res.json()).then(setStations);
  }, []);

  const generateForecast = async () => {
    if (!selectedStation) return toast.error('Please select a station');
    
    setLoading(true);
    try {
      // 1. Fetch historical data for context
      const res = await fetch(`/api/charts/trends?station_id=${selectedStation}`);
      const history = await res.json();
      
      // 2. Initialize Gemini
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      
      // 3. Generate Prediction
      const prompt = `
        As a climate scientist, analyze this historical weather data for station ${selectedStation} (last 30 days):
        ${JSON.stringify(history)}
        
        Predict the average temperature and precipitation for the NEXT month.
        Provide the response in JSON format with these fields:
        - predicted_temp: number (Celsius)
        - predicted_rain: number (mm)
        - confidence_score: number (0-100)
        - reasoning: string (brief explanation)
        - anomalies_detected: string[] (potential risks)
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(result.text);
      setPrediction(data);
      toast.success('Predictive model generated successfully');
    } catch (error) {
      console.error('Forecast error:', error);
      toast.error('Failed to generate forecast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-aqua-deep flex items-center gap-2">
            <BrainCircuit size={24} /> AI_PREDICTIVE_MODELING
          </h3>
          <p className="text-sm text-context-gray">Using Gemini 3.0 Flash to forecast regional climate shifts.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={selectedStation} onValueChange={setSelectedStation}>
            <SelectTrigger className="w-[200px] bg-white border-aqua-dark/20">
              <SelectValue placeholder="Select Station" />
            </SelectTrigger>
            <SelectContent>
              {stations.map((s: any) => (
                <SelectItem key={s.station_id} value={s.station_id.toString()}>{s.station_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={generateForecast} 
            disabled={loading}
            className="bg-aqua-deep hover:bg-aqua-dark text-white font-bold"
          >
            {loading ? 'ANALYZING...' : 'GENERATE_FORECAST'}
          </Button>
        </div>
      </div>

      {prediction ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-aqua-dark/20 bg-white/50 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono uppercase opacity-50">Predicted_Avg_Temp</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-warm-deep flex items-center gap-2">
                <Thermometer size={32} /> {prediction.predicted_temp}°C
              </div>
              <p className="text-[10px] mt-2 font-mono text-nature-mid">CONFIDENCE: {prediction.confidence_score}%</p>
            </CardContent>
          </Card>

          <Card className="border-aqua-dark/20 bg-white/50 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono uppercase opacity-50">Predicted_Precipitation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-cold-deep flex items-center gap-2">
                <TrendingUp size={32} /> {prediction.predicted_rain}mm
              </div>
              <p className="text-[10px] mt-2 font-mono text-context-gray uppercase">Monthly Aggregate</p>
            </CardContent>
          </Card>

          <Card className="border-aqua-dark/20 bg-white/50 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono uppercase opacity-50">AI_Reasoning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs italic leading-relaxed">"{prediction.reasoning}"</p>
            </CardContent>
          </Card>

          <Card className="border-aqua-dark/20 bg-white/50 shadow-none md:col-span-3">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-warm-deep">
                <Sparkles size={16} /> Potential Anomalies & Risks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {prediction.anomalies_detected.map((risk: string, i: number) => (
                  <div key={i} className="px-3 py-1 rounded-full bg-warm-mid/10 border border-warm-mid/20 text-warm-deep text-[10px] font-bold uppercase">
                    {risk}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="h-64 border-2 border-dashed border-aqua-dark/10 rounded-xl flex flex-center items-center justify-center bg-aqua-light/5">
          <div className="text-center space-y-2">
            <BrainCircuit size={48} className="mx-auto text-aqua-deep/20" />
            <p className="text-sm font-mono text-aqua-deep/40 uppercase tracking-widest">Select station to initiate predictive analysis</p>
          </div>
        </div>
      )}
    </div>
  );
}
