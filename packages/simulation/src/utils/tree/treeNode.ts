export class TreeNode<T> {
  public children: TreeNode<T>[] = []
  constructor(
    public nodeKey: string,
    public nodeLevel: number,
    public source: T,
    private parent?: TreeNode<T>,
  ) {
    this.nodeKey = nodeKey
    this.parent = parent
    this.children = []
  }

  get isLeaf(): boolean {
    return this.children.length === 0
  }

  get hasChildren(): boolean {
    return !this.isLeaf
  }

}
