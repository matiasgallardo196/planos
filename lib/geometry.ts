import { Point } from "./storage";

export const getSvgCoordinates = (
  event: React.MouseEvent | MouseEvent,
  svg: SVGSVGElement
): Point => {
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const transformedPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());
  return { x: transformedPoint.x, y: transformedPoint.y };
};

// Simple ray-casting algorithm for point in polygon
export const isPointInPolygon = (point: Point, vs: Point[]): boolean => {
  const x = point.x, y = point.y;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].x, yi = vs[i].y;
    const xj = vs[j].x, yj = vs[j].y;

    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};
