import { DefaultLogger, LogLevel, mergeConfig } from '@vendure/core';
import {
  createTestEnvironment,
  registerInitializer,
  SimpleGraphQLClient,
  SqljsInitializer,
  testConfig,
} from '@vendure/testing';
import { TestServer } from '@vendure/testing/lib/test-server';
import { initialData } from '../../test/src/initial-data';
import { SortByPopularityPlugin } from '../src/index';
import {
  createSettledOrder,
  createSettledOrderForVariants,
  getProductWithId,
} from '../../test/src/shop-utils';
import {
  assignOptionGroupsToProduct,
  createCollectionContainingVariants,
  createProduct,
  createProductVariants,
  getAllCollections,
  getAllOrders,
} from '../../test/src/admin-utils';
import { testPaymentMethod } from '../../test/src/test-payment-method';
import {
  Collection,
  GET_COLLECTION_ADMIN,
  LanguageCode,
  Product,
  ProductVariant,
  QueryCollectionArgs,
} from '../../test/src/generated/admin-graphql';
import { BullMQJobQueuePlugin } from '@vendure/job-queue-plugin/package/bullmq';
jest.setTimeout(10000);

describe('Sort by Popularity Plugin', function () {
  let server: TestServer;
  let adminClient: SimpleGraphQLClient;
  let shopClient: SimpleGraphQLClient;
  let serverStarted = false;

  beforeAll(async () => {
    registerInitializer('sqljs', new SqljsInitializer('__data__'));
    const config = mergeConfig(testConfig, {
      apiOptions: {
        port: 3106,
      },
      logger: new DefaultLogger({ level: LogLevel.Debug }),
      plugins: [
        SortByPopularityPlugin,
        // BullMQJobQueuePlugin.init({
        //   connection: {
        //     port: 6379
        //   }
        // }),
      ],
      paymentOptions: {
        paymentMethodHandlers: [testPaymentMethod],
      },
    });

    ({ server, adminClient, shopClient } = createTestEnvironment(config));
    await server.init({
      initialData: {
        ...initialData,
        paymentMethods: [
          {
            name: testPaymentMethod.code,
            handler: { code: testPaymentMethod.code, arguments: [] },
          },
        ],
      },
      productsCsvPath: '../test/src/products-import.csv',
      customerCount: 2,
    });
    serverStarted = true;
    await adminClient.asSuperAdmin();
  }, 60000);

  it('Should start successfully', async () => {
    expect(serverStarted).toBe(true);
  });

  it('Should place test orders', async () => {
    for (let i = 0; i < 5; i++) {
      await createSettledOrderForVariants(
        shopClient,
        [{ id: 'T_2', quantity: 2 }],
        1
      );
    }
    const orders = await getAllOrders(adminClient);
    expect(orders.length).toBe(5);
    // Expect all orders to be from the same product
    expect(
      orders.every((order) =>
        order.lines.every((line) => line.productVariant.product.id === 'T_1')
      )
    ).toBe(true);
  });

  let createdProducts: Product[] = [];
  let createdCollections: Collection[] = [];

  it('Create product with variant and collection', async () => {
    const newProduct = await createProduct(adminClient, {
      description: '<p>New product</p>',
      name: 'New Product',
      slug: 'new-product',
    });
    // expect(newProduct.name).toBe('New Product');
    const updatedNewProduct = await assignOptionGroupsToProduct(
      adminClient,
      newProduct,
      [
        {
          code: 'new-group-0',
          options: [
            {
              code: 'new-00',
              translations: [
                {
                  languageCode: LanguageCode.En,
                  name: 'new-00',
                },
              ],
            },
            {
              code: 'new-01',
              translations: [
                {
                  languageCode: LanguageCode.En,
                  name: 'new-01',
                },
              ],
            },
          ],
          translations: [
            {
              languageCode: LanguageCode.En,
              name: 'new-group-0',
            },
          ],
        },
        {
          code: 'new-group-1',
          options: [
            {
              code: 'new-10',
              translations: [
                {
                  languageCode: LanguageCode.En,
                  name: 'new-10',
                },
              ],
            },
            {
              code: 'new-11',
              translations: [
                {
                  languageCode: LanguageCode.En,
                  name: 'new-11',
                },
              ],
            },
          ],
          translations: [
            {
              languageCode: LanguageCode.En,
              name: 'new-group-1',
            },
          ],
        },
      ]
    );
    const newVariants = await createProductVariants(
      adminClient,
      updatedNewProduct
    );
    expect(
      newVariants.every((v) => v.product.id === updatedNewProduct.id)
    ).toBe(true);
    const newCollection = await createCollectionContainingVariants(
      adminClient,
      {
        description: '<p>New Collection</p>',
        name: 'New Collection',
        slug: 'new-collection',
      },
      newVariants,
      'T_1'
    );
    // console.log(newCollection.id,'1')
    // await new Promise((r) => setTimeout(r, 1000));
    expect(newCollection?.parent?.id === 'T_1').toBe(true);
    createdProducts.push(updatedNewProduct);
    createdCollections.push(newCollection);
  });

  it('Create product with variant and collection and settled orders', async () => {
    const newProduct = await createProduct(adminClient, {
      description: '<p>Another product</p>',
      name: 'Another Product',
      slug: 'another-product',
    });
    const updatedAnotherProduct = await assignOptionGroupsToProduct(
      adminClient,
      newProduct,
      [
        {
          code: 'another-group-0',
          options: [
            {
              code: 'another-00',
              translations: [
                {
                  languageCode: LanguageCode.En,
                  name: 'another-00',
                },
              ],
            },
            {
              code: 'another-01',
              translations: [
                {
                  languageCode: LanguageCode.En,
                  name: 'another-01',
                },
              ],
            },
          ],
          translations: [
            {
              languageCode: LanguageCode.En,
              name: 'another-group-0',
            },
          ],
        },
        {
          code: 'another-group-1',
          options: [
            {
              code: 'another-10',
              translations: [
                {
                  languageCode: LanguageCode.En,
                  name: 'another-10',
                },
              ],
            },
            {
              code: 'another-11',
              translations: [
                {
                  languageCode: LanguageCode.En,
                  name: 'another-11',
                },
              ],
            },
          ],
          translations: [
            {
              languageCode: LanguageCode.En,
              name: 'another-group-1',
            },
          ],
        },
      ]
    );
    const newProductVariants = await createProductVariants(
      adminClient,
      updatedAnotherProduct
    );
    expect(
      newProductVariants.every((v) => v.product.id === updatedAnotherProduct.id)
    ).toBe(true);
    // console.log(newProductVariants,'updatedAnotherProduct');
    const order = await createSettledOrderForVariants(
      shopClient,
      newProductVariants.map((v) => {
        return { id: v.id, quantity: 2 };
      }),
      1
    );
    expect(
      order.lines.every(
        (line) => line.productVariant.product.id === updatedAnotherProduct.id
      )
    ).toBe(true);
    const anotherCollection = await createCollectionContainingVariants(
      adminClient,
      {
        description: '<p>Another Collection</p>',
        name: 'Another Collection',
        slug: 'another-collection',
      },
      newProductVariants
    );
    expect(anotherCollection.parent!.id === 'T_1').toBe(true);
    createdCollections.push(anotherCollection);
    createdProducts.push(updatedAnotherProduct);
  });

  it('variant updating job is done for collection T_4', async () => {
    await new Promise((r) => setTimeout(r, 1000));
    const refetchedNewCollectionData: any = await adminClient.query(
      GET_COLLECTION_ADMIN,
      { id: 'T_4' }
    );
    // console.log(createdCollections[0].id,createdCollections[1].id,'createdCollections[0].id')
    expect(
      refetchedNewCollectionData.collection.productVariants.totalItems > 0 &&
        refetchedNewCollectionData.collection.productVariants.items.every(
          (item: ProductVariant) => item.product.id === 'T_2'
        )
    ).toBe(true);
  });

  it('variant updating job is done for collection T_5', async () => {
    await new Promise((r) => setTimeout(r, 1000));
    const refetchedAnotherCollectionData: any = await adminClient.query(
      GET_COLLECTION_ADMIN,
      { id: 'T_5' }
    );
    expect(
      refetchedAnotherCollectionData.collection.productVariants.totalItems >
        0 &&
        refetchedAnotherCollectionData.collection.productVariants.items.every(
          (item: ProductVariant) => item.product.id === 'T_3'
        )
    ).toBe(true);
  });

  it('Calls webhook to calculate popularity', async () => {
    // TODO Verify that the api call to order-by-popularity/calculate-scores was successfull.
    // await new Promise((r) => setTimeout(r, 1000));
    const res = await adminClient.fetch(
      `http://localhost:3106/order-by-popularity/calculate-scores/e2e-default-channel`
    );
    expect(res.status).toBe(200);
  });

  it('Calculated popularity per product', async () => {
    await new Promise((r) => setTimeout(r, 1000));
    const data: any = await getProductWithId(shopClient, 'T_1');
    expect(data.product.customFields.popularityScore).toBe(1000);
    const newProduct: any = await getProductWithId(
      shopClient,
      createdProducts[0].id
    );
    expect(newProduct.product.customFields.popularityScore).toBe(0);
    const anotherProduct: any = await getProductWithId(
      shopClient,
      createdProducts[1].id
    );
    expect(anotherProduct.product.customFields.popularityScore).toBe(800);
  });

  it('Calculated popularity per collection', async () => {
    // await new Promise((r) => setTimeout(r,5000));
    const refetchedParentData: any = await adminClient.query(
      GET_COLLECTION_ADMIN,
      { id: 'T_2' }
    );
    const refetchedChildData: any = await adminClient.query(
      GET_COLLECTION_ADMIN,
      { id: 'T_3' }
    );
    const refetchedNewCollectionData: any = await adminClient.query(
      GET_COLLECTION_ADMIN,
      { id: 'T_4' }
    );
    // console.log(createdCollections[0].id,createdCollections[1].id,'createdCollections[0].id')
    const refetchedAnotherCollectionData: any = await adminClient.query(
      GET_COLLECTION_ADMIN,
      { id: 'T_5' }
    );
    expect(
      refetchedNewCollectionData.collection.customFields.popularityScore
    ).toBe(0);
    expect(refetchedParentData.collection.customFields.popularityScore).toBe(
      1000
    );
    expect(refetchedChildData.collection.customFields.popularityScore).toBe(
      1000
    );
    expect(
      refetchedAnotherCollectionData.collection.customFields.popularityScore
    ).toBe(800);
  });

  it('Calculated popularity for parent collections', async () => {
    const refetchedRootData: any = await adminClient.query(
      GET_COLLECTION_ADMIN,
      { id: 'T_1' }
    );
    expect(refetchedRootData.collection.customFields.popularityScore).toBe(
      2800
    );
  });

  afterAll(async () => {
    //  const all= await getAllCollections(adminClient);
    // console.log(all.collections.items.map((c:any)=> `${c.id} | ${c.productVariants.items.map((v:any)=> v.product.id)}`));
    return server.destroy();
  });
});
