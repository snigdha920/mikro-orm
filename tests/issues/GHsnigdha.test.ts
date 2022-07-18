import { Collection, Entity, IdentifiedReference, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property, wrap } from '@mikro-orm/core';


@Entity()
export class Application {

  @PrimaryKey()
  _id!: number;

  @Property()
  name: string;

  @OneToMany('Network', 'application')
  public networks = new Collection<Network>(this);

  @OneToMany('Node', 'application')
  public nodes = new Collection<Node>(this);

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
export class Network {

  @PrimaryKey()
  _id!: number;

  @Property()
  name: string;

  @ManyToOne('Application', { wrappedReference: true, eager: true })
  public application!: IdentifiedReference<Application, 'id' | '_id'>;

  @OneToMany('Node', 'network')
  public nodes = new Collection<Node>(this);

  constructor(name: string) {
    this.name = name;
  }

}


@Entity()
export class Node {

  @PrimaryKey()
  _id!: number;

  @Property()
  name: string;

  @ManyToOne('Application', { wrappedReference: true, eager: true })
  public application!: IdentifiedReference<Application, 'id' | '_id'>;

  @ManyToOne('Network', { wrappedReference: true, eager: true })
  public network!: IdentifiedReference<Network, 'id' | '_id'>;

  constructor(name: string) {
    this.name = name;
  }

}

describe('Snigdha test issue', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Application, Network, Node],
      dbName: ':memory:',
      type: 'mongo',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('relationships should be cascade persisted', async () => {
    const application = orm.em.create(Application, { name: 'app' });
    await orm.em.persistAndFlush(application);
    const network = new Network('network');
    network.application = wrap(application).toReference();
    const node1 = new Node('node1');
    const node2 = new Node('node2');
    node1.application = wrap(application).toReference();
    node2.application = wrap(application).toReference();
    node1.network = wrap(network).toReference();
    node2.network = wrap(network).toReference();
    orm.em.persistAndFlush([network, node1, node2]);
    const fetchedApp = await orm.em.find(Application, { _id: application._id }, { populate: ['networks', 'nodes'] });
    expect(fetchedApp[0].networks.count()).toBe(1);
    expect(fetchedApp[0].nodes.count()).toBe(2);
  });

});


