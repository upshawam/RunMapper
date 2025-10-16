import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Routing API proxy to keep API key secure
  app.post('/api/route', async (req, res) => {
    try {
      const { start, end } = req.body;
      const apiKey = process.env.OPENROUTESERVICE_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
      }

      const response = await fetch('https://api.openrouteservice.org/v2/directions/foot-walking/geojson', {
        method: 'POST',
        headers: {
          'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
          'Authorization': apiKey,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          coordinates: [[start[1], start[0]], [end[1], end[0]]],
          elevation: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Routing API error:', errorText);
        return res.status(response.status).json({ error: 'Routing API failed' });
      }

      const data = await response.json();
      console.log('Routing response sample:', JSON.stringify(data).substring(0, 200));
      res.json(data);
    } catch (error) {
      console.error('Routing error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
