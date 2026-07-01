import { DofID } from 'ts-fem';
import { useProjectStore } from '@/store/project';

export type EducationTemplateId =
  | 'cantilever'
  | 'simply-supported'
  | 'overhanging'
  | 'portal-frame'
  | 'truss'
  | 'composite-rod'
  | 'temperature-beam';

export type EducationTemplate = {
  id: EducationTemplateId;
  titleKey: string;
  descriptionKey: string;
  icon: string;
};

export const educationTemplates: EducationTemplate[] = [
  {
    id: 'cantilever',
    titleKey: 'education.templates.cantilever.title',
    descriptionKey: 'education.templates.cantilever.description',
    icon: 'mdi-ray-start-arrow',
  },
  {
    id: 'simply-supported',
    titleKey: 'education.templates.simplySupported.title',
    descriptionKey: 'education.templates.simplySupported.description',
    icon: 'mdi-arrow-left-right-bold',
  },
  {
    id: 'overhanging',
    titleKey: 'education.templates.overhanging.title',
    descriptionKey: 'education.templates.overhanging.description',
    icon: 'mdi-vector-line',
  },
  {
    id: 'portal-frame',
    titleKey: 'education.templates.portalFrame.title',
    descriptionKey: 'education.templates.portalFrame.description',
    icon: 'mdi-gate',
  },
  {
    id: 'truss',
    titleKey: 'education.templates.truss.title',
    descriptionKey: 'education.templates.truss.description',
    icon: 'mdi-triangle-outline',
  },
  {
    id: 'composite-rod',
    titleKey: 'education.templates.compositeRod.title',
    descriptionKey: 'education.templates.compositeRod.description',
    icon: 'mdi-link-variant',
  },
  {
    id: 'temperature-beam',
    titleKey: 'education.templates.temperatureBeam.title',
    descriptionKey: 'education.templates.temperatureBeam.description',
    icon: 'mdi-thermometer-lines',
  },
];

const createDefaultLibrary = () => {
  const projectStore = useProjectStore();
  const domain = projectStore.solver.domain;

  domain.createMaterial('Steel', {
    e: 210000e6,
    g: 210000e6 / (2 * (1 + 0.3)),
    alpha: 12e-6,
    d: 7850,
  });

  domain.createMaterial('Aluminum', {
    e: 70000e6,
    g: 70000e6 / (2 * (1 + 0.33)),
    alpha: 23e-6,
    d: 2700,
  });

  domain.createCrossSection('Rect', {
    a: 0.01,
    iy: 8.333e-6,
    iz: 8.333e-6,
    dyz: 0,
    h: 0.2,
    k: 5 / 6,
    j: 1.667e-5,
  });

  domain.createCrossSection('Rod', {
    a: 0.004,
    iy: 1.333e-6,
    iz: 1.333e-6,
    dyz: 0,
    h: 0.08,
    k: 1,
    j: 2.666e-6,
  });
};

const resetModel = () => {
  const projectStore = useProjectStore();
  const solver = projectStore.solver;

  for (const loadCase of solver.loadCases) {
    loadCase.solved = false;
    loadCase.prescribedBC = [];
    loadCase.nodalLoadList = [];
    loadCase.elementLoadList = [];
  }

  solver.domain.nodes.clear();
  solver.domain.elements.clear();
  solver.domain.materials.clear();
  solver.domain.crossSections.clear();
  projectStore.dimensions = [];
  projectStore.clearSelection();
  projectStore.clearSelection2();

  createDefaultLibrary();
};

const finalizeTemplate = () => {
  const projectStore = useProjectStore();
  const domain = projectStore.solver.domain;

  domain.nodes = new Map(domain.nodes);
  domain.elements = new Map(domain.elements);
  domain.materials = new Map(domain.materials);
  domain.crossSections = new Map(domain.crossSections);
  projectStore.solver.domain = domain;
};

const applyTemplateModel = (id: EducationTemplateId) => {
  const projectStore = useProjectStore();
  const domain = projectStore.solver.domain;
  const loadCase = projectStore.solver.loadCases[0];

  resetModel();
  loadCase.label = id;

  if (id === 'cantilever') {
    domain.createNode('A', [0, 0, 0], [DofID.Dx, DofID.Dz, DofID.Ry]);
    domain.createNode('B', [4, 0, 0], []);
    domain.createBeam2D('E1', ['A', 'B'], 'Steel', 'Rect');
    loadCase.createNodalLoad('B', { [DofID.Dz]: -12000, [DofID.Ry]: -6000 });
  }

  if (id === 'simply-supported') {
    domain.createNode('A', [0, 0, 0], [DofID.Dx, DofID.Dz]);
    domain.createNode('B', [6, 0, 0], [DofID.Dz]);
    domain.createBeam2D('E1', ['A', 'B'], 'Steel', 'Rect');
    loadCase.createBeamConcentratedLoad('E1', [0, -18000, 0, 3], true);
  }

  if (id === 'overhanging') {
    domain.createNode('A', [0, 0, 0], [DofID.Dx, DofID.Dz]);
    domain.createNode('B', [5, 0, 0], [DofID.Dz]);
    domain.createNode('C', [7, 0, 0], []);
    domain.createBeam2D('E1', ['A', 'B'], 'Steel', 'Rect');
    domain.createBeam2D('E2', ['B', 'C'], 'Steel', 'Rect');
    loadCase.createBeamElementUniformEdgeLoad('E1', [0, -5000], true);
    loadCase.createNodalLoad('C', { [DofID.Dz]: -10000 });
  }

  if (id === 'portal-frame') {
    domain.createNode('A', [0, 0, 0], [DofID.Dx, DofID.Dz, DofID.Ry]);
    domain.createNode('B', [0, 0, 3], []);
    domain.createNode('C', [4, 0, 3], []);
    domain.createNode('D', [4, 0, 0], [DofID.Dx, DofID.Dz, DofID.Ry]);
    domain.createBeam2D('E1', ['A', 'B'], 'Steel', 'Rect');
    domain.createBeam2D('E2', ['B', 'C'], 'Steel', 'Rect');
    domain.createBeam2D('E3', ['C', 'D'], 'Steel', 'Rect');
    loadCase.createNodalLoad('C', { [DofID.Dx]: 12000, [DofID.Dz]: -8000 });
  }

  if (id === 'truss') {
    domain.createNode('A', [0, 0, 0], [DofID.Dx, DofID.Dz, DofID.Ry]);
    domain.createNode('B', [4, 0, 0], [DofID.Dz, DofID.Ry]);
    domain.createNode('C', [2, 0, 2.6], [DofID.Ry]);
    domain.createBeam2D('E1', ['A', 'B'], 'Steel', 'Rod', [true, true]);
    domain.createBeam2D('E2', ['A', 'C'], 'Steel', 'Rod', [true, true]);
    domain.createBeam2D('E3', ['C', 'B'], 'Steel', 'Rod', [true, true]);
    loadCase.createNodalLoad('C', { [DofID.Dz]: -16000 });
  }

  if (id === 'composite-rod') {
    domain.createNode('A', [0, 0, 0], [DofID.Dx, DofID.Dz, DofID.Ry]);
    domain.createNode('B', [2.5, 0, 0], [DofID.Dz, DofID.Ry]);
    domain.createNode('C', [5, 0, 0], [DofID.Dz, DofID.Ry]);
    domain.createBeam2D('E1', ['A', 'B'], 'Steel', 'Rod');
    domain.createBeam2D('E2', ['B', 'C'], 'Aluminum', 'Rod');
    loadCase.createNodalLoad('C', { [DofID.Dx]: 50000 });
  }

  if (id === 'temperature-beam') {
    domain.createNode('A', [0, 0, 0], [DofID.Dx, DofID.Dz, DofID.Ry]);
    domain.createNode('B', [4, 0, 0], [DofID.Dx, DofID.Dz, DofID.Ry]);
    domain.createBeam2D('E1', ['A', 'B'], 'Steel', 'Rect');
    loadCase.createBeamTemperatureLoad('E1', [35, 0, 0]);
  }

  finalizeTemplate();
};

export const applyEducationTemplate = (id: EducationTemplateId, withUndo = true) => {
  void withUndo;
  applyTemplateModel(id);
  useProjectStore().solve();
};
