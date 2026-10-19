async function validateDS() {
  try {
    const ds = await import('ds-grupo-rkb');
    console.log('Design System imported successfully');
    console.log('DS version:', ds.default ? '(default export)' : 'named exports');
    // Check if Button is available
    if (ds.Button) {
      console.log('Button component is available');
    } else {
      console.log('Button component not found in direct import');
    }
    // Check if the package has the expected exports
    const expected = ['Button', 'Tag', 'Container', 'Section', 'Grid', 'Header', 'Footer', 'FooterBanner', 'Reveal', 'Card', 'FormField', 'Input', 'Textarea', 'Heading', 'Text', 'TypographyPalette', 'IconSet', 'BrandIcon', 'BackToTop', 'FeatureCard', 'Drawer', 'AccordionGroup', 'AccordionItem', 'Carousel', 'CarouselSlide'];
    const missing = expected.filter(key => !(key in ds));
    if (missing.length === 0) {
      console.log('All expected components are present');
    } else {
      console.log('Missing components:', missing);
    }
  } catch (err) {
    console.error('Failed to import Design System:', err);
  }
}

validateDS();
