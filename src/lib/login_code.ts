import { prisma } from "@/lib/prisma";

export type LoginCodeBaseData = {
  userAccountId: string;
  email: string;
  codeHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
};

export type LoginCodePersistedData = LoginCodeBaseData & {
  id: string;
};

export type LoginCodeCreateData = Pick<
  LoginCodeBaseData,
  "userAccountId" | "email" | "codeHash" | "expiresAt"
> &
  Partial<Pick<LoginCodeBaseData, "consumedAt" | "createdAt">>;

export class LoginCode {
  public data: LoginCodeCreateData | LoginCodePersistedData;

  public constructor(data: LoginCodeCreateData | LoginCodePersistedData) {
    this.data = {
      consumedAt: null,
      ...data,
    };
  }

  public async create(): Promise<LoginCode> {
    const record = await prisma.loginCode.create({
      data: {
        userAccountId: this.data.userAccountId,
        email: this.data.email,
        codeHash: this.data.codeHash,
        expiresAt: this.data.expiresAt,
        consumedAt: this.data.consumedAt ?? null,
      },
    });

    return LoginCode.fromRecord(record);
  }

  public async delete(): Promise<void> {
    await prisma.loginCode.delete({
      where: { id: this.persistedId },
    });
  }

  public get persistedId(): string {
    if (!("id" in this.data) || !this.data.id) {
      throw new Error("login_code_id_required");
    }

    return this.data.id;
  }

  public static async consumeActiveCodesForEmail(
    userAccountId: string,
    email: string,
  ): Promise<void> {
    await prisma.loginCode.updateMany({
      where: {
        userAccountId,
        email,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    });
  }

  public static async findLatestActiveCode(
    userAccountId: string,
    email: string,
  ): Promise<LoginCode | null> {
    const record = await prisma.loginCode.findFirst({
      where: {
        userAccountId,
        email,
        consumedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return record ? LoginCode.fromRecord(record) : null;
  }

  private static fromRecord(record: LoginCodePersistedData): LoginCode {
    return new LoginCode(record);
  }
}
