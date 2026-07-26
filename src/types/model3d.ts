export interface Vector3Data {
  x: number;
  y: number;
  z: number;
}

export interface Node3D {
  id: string;
  x: number;
  y: number;
  z: number;
}

export interface Member3D {
  id: string;
  startNodeId: string;
  endNodeId: string;
  sectionId?: string;
  materialId?: string;
  localAxisRotation?: number;
}

export interface NodalLoad3D {
  nodeId: string;
  force: Vector3Data;
  moment: Vector3Data;
  coordinateSystem: 'global' | 'local';
}

export interface DistributedLoad3D {
  id: string;
  memberId: string;
  startForce: Vector3Data;
  endForce: Vector3Data;
  coordinateSystem: 'global' | 'local';
}

export interface NodeConstraint3D {
  nodeId: string;
  constrainedDofs: Array<'Ux' | 'Uy' | 'Uz' | 'Rx' | 'Ry' | 'Rz'>;
}

export interface NodeDisplacement3D {
  nodeId: string;
  translation: Vector3Data;
  rotation: Vector3Data;
}

export interface MemberForce3D {
  memberId: string;
  position: number;
  axialForce: number;
  shearY: number;
  shearZ: number;
  torsion: number;
  bendingY: number;
  bendingZ: number;
}

export interface MemberLocalAxes3D {
  x: Vector3Data;
  y: Vector3Data;
  z: Vector3Data;
}

export interface StructureSceneModel3D {
  coordinateSystem: 'legacy-2d-xz' | 'global-xyz';
  nodes: Node3D[];
  members: Member3D[];
  nodalLoads: NodalLoad3D[];
  distributedLoads: DistributedLoad3D[];
  constraints: NodeConstraint3D[];
  displacements: NodeDisplacement3D[];
  memberForces: MemberForce3D[];
  solved: boolean;
}
