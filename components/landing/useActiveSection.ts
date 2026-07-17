'use client';

import { useEffect, useState } from 'react';

export function useActiveSection(sectionIds: string[]) {
  const [activeSection, setActiveSection] = useState(sectionIds[0] ?? '');

  useEffect(() => {
    if (!sectionIds.length) return;

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length === 0) return;

        const topEntry = visibleEntries.reduce((a, b) =>
          a.intersectionRatio > b.intersectionRatio ? a : b,
        );

        setActiveSection(topEntry.target.id);
      },
      {
        rootMargin: '-30% 0px -55% 0px',
        threshold: [0.25, 0.5, 0.75],
      },
    );

    elements.forEach((element) => observer.observe(element));
    return () => elements.forEach((element) => observer.unobserve(element));
  }, [sectionIds]);

  return activeSection;
}
