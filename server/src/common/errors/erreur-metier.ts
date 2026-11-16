export class ErreurMetier extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly type: string,
    public readonly titre: string,
    public readonly erreurs?: Array<{
      champ: string;
      message: string;
    }>,
    public readonly headers?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ErreurMetier';
  }
}
