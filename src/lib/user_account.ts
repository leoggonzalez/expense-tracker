import { prisma } from "@/lib/prisma";

export type UserAccountBaseData = {
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserAccountPersistedData = UserAccountBaseData & {
  id: string;
};

export type UserAccountCreateData = Pick<UserAccountBaseData, "email"> &
  Partial<Pick<UserAccountBaseData, "name" | "createdAt" | "updatedAt">>;

export type UserAccountRecord = UserAccountPersistedData;

export class UserAccount {
  public data: UserAccountCreateData | UserAccountPersistedData;

  public constructor(data: UserAccountCreateData | UserAccountPersistedData) {
    this.data = {
      name: null,
      ...data,
    };
  }

  public async create(): Promise<UserAccount> {
    const record = await prisma.userAccount.create({
      data: {
        email: this.data.email,
        name: this.data.name ?? null,
      },
    });

    return UserAccount.fromRecord(record);
  }

  public async updateName(name: string | null): Promise<UserAccount> {
    const record = await prisma.userAccount.update({
      where: { id: this.persistedId },
      data: {
        name,
      },
    });

    return UserAccount.fromRecord(record);
  }

  public get persistedId(): string {
    if (!("id" in this.data) || !this.data.id) {
      throw new Error("user_account_id_required");
    }

    return this.data.id;
  }

  public toRecord(): UserAccountPersistedData {
    if (!("id" in this.data) || !this.data.id) {
      throw new Error("user_account_id_required");
    }

    if (!this.data.createdAt || !this.data.updatedAt) {
      throw new Error("user_account_date_required");
    }

    return {
      id: this.data.id,
      email: this.data.email,
      name: this.data.name ?? null,
      createdAt: this.data.createdAt,
      updatedAt: this.data.updatedAt,
    };
  }

  public static async findById(id: string): Promise<UserAccount | null> {
    const record = await prisma.userAccount.findUnique({
      where: { id },
    });

    return record ? UserAccount.fromRecord(record) : null;
  }

  public static async findByEmail(email: string): Promise<UserAccount | null> {
    const record = await prisma.userAccount.findUnique({
      where: { email },
    });

    return record ? UserAccount.fromRecord(record) : null;
  }

  public static async upsertByEmail(
    email: string,
    input?: { name?: string | null },
  ): Promise<UserAccount> {
    const record = await prisma.userAccount.upsert({
      where: { email },
      update: {},
      create: {
        email,
        ...(input?.name !== undefined ? { name: input.name } : {}),
      },
    });

    return UserAccount.fromRecord(record);
  }

  private static fromRecord(record: UserAccountPersistedData): UserAccount {
    return new UserAccount(record);
  }
}
