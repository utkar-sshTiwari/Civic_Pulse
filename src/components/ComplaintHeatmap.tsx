import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

interface Complaint {
  latitude: number;
  longitude: number;
  priority_score: number;
}

interface ComplaintHeatmapProps {
  complaints: Complaint[];
}

function ComplaintHeatmap({
  complaints,
}: ComplaintHeatmapProps) {
  const map = useMap();

  useEffect(() => {
    if (complaints.length === 0) {
      return;
    }

    const points = complaints.map(
      (complaint) =>
        [
          complaint.latitude,
          complaint.longitude,

          // Convert priority score 0-10
          // into heat intensity 0-1
          Math.max(
            0.1,
            Math.min(
              complaint.priority_score / 10,
              1
            )
          ),

        ] as [number, number, number]
    );

    const heatLayer = L.heatLayer(points, {
      radius: 30,
      blur: 22,
      maxZoom: 17,
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };

  }, [map, complaints]);

  return null;
}

export default ComplaintHeatmap;
