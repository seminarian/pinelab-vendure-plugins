import { LanguageCode } from '@vendure/common/lib/generated-types';
import { type InitialData } from '@vendure/core';

export const initialData: InitialData = {
  defaultLanguage: LanguageCode.en,
  defaultZone: 'Europe',
  taxRates: [
    { name: 'Standard Tax', percentage: 20 },
    { name: 'Reduced Tax', percentage: 10 },
    { name: 'Zero Tax', percentage: 0 },
  ],
  shippingMethods: [
    { name: 'Standard Shipping', price: 500 },
    { name: 'Express Shipping', price: 1000 },
  ],
  countries: [
    { name: 'Australia', code: 'AU', zone: 'Oceania' },
    { name: 'Austria', code: 'AT', zone: 'Europe' },
    { name: 'Canada', code: 'CA', zone: 'Americas' },
    { name: 'China', code: 'CN', zone: 'Asia' },
    { name: 'South Africa', code: 'ZA', zone: 'Africa' },
    { name: 'United Kingdom', code: 'GB', zone: 'Europe' },
    { name: 'United States of America', code: 'US', zone: 'Americas' },
    { name: 'Nederland', code: 'NL', zone: 'Europe' },
  ],
  collections: [
    {
      name: 'Computers',
      filters: [
        {
          code: 'facet-value-filter',
          args: { facetValueNames: ['computers'], containsAny: false },
        },
      ],
    },
    {
      name: 'Electronics',
      filters: [
        {
          code: 'facet-value-filter',
          args: { facetValueNames: ['electronics'], containsAny: false },
        },
      ],
    },
  ],
  paymentMethods: [],
  /*  paymentMethods: [
    {
      name: testPaymentMethod.code,
      handler: { code: testPaymentMethod.code, arguments: [] },
    },
  ], */
};
