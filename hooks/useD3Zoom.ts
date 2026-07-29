// hooks/useD3Zoom.ts
import { useEffect, useRef } from 'react';
import { select } from 'd3-selection';
import { zoom, zoomIdentity } from 'd3-zoom';
import { useCanvasStore } from '../store/useCanvasStore';

export const useD3Zoom = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<SVGGElement | null>(null);
  
  const { 
    zoomScale, 
    setZoomScale, 
    setPan 
  } = useCanvasStore();

  useEffect(() => {
    if (!svgRef.current) return;

    const svgEl = svgRef.current;
    const svgSelection = select(svgEl);

    // D3 Zoom 행동 정의 (화면 중앙 고정, 확대/축소만 허용)
    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5.0]) // 확대 배율 0.5x ~ 5.0x
      .filter((event) => {
        // 휠 줌(wheel) 및 멀티터치 핀치만 허용, 드래그 이탈 방지
        return event.type === 'wheel' || (event.type === 'touchstart' && event.touches?.length > 1);
      })
      .on('zoom', (event) => {
        const { transform } = event;
        setZoomScale(transform.k);
        setPan(0, 0); // 화면 이탈 방지용 pan 고정
      });

    svgSelection.call(zoomBehavior);

    // D3 더블클릭 줌 차단
    svgSelection.on('dblclick.zoom', null);

    return () => {
      svgSelection.on('.zoom', null);
    };
  }, [setZoomScale, setPan]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svgEl = svgRef.current;
    const svgSelection = select(svgEl);
    
    const d3ZoomObj = (svgEl as any).__zoom;
    const currentK = d3ZoomObj ? d3ZoomObj.k : 1.0;

    if (Math.abs(currentK - zoomScale) > 0.001) {
      const nextTransform = zoomIdentity.scale(zoomScale);
      const tempZoom = zoom<SVGSVGElement, unknown>().scaleExtent([0.5, 5.0]);
      svgSelection.call(tempZoom.transform as any, nextTransform);
    }
  }, [zoomScale]);

  return {
    svgRef,
    containerRef
  };
};
