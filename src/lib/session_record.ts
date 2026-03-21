import { prisma } from "@/lib/prisma";
import { type UserAccountRecord } from "@/lib/user_account";

export type SessionBaseData = {
  userAccountId: string;
  sessionTokenHash: string;
  expiresAt: Date;
  createdAt: Date;
};

export type SessionPersistedData = SessionBaseData & {
  id: string;
};

export type SessionWithUserAccountRecord = SessionPersistedData & {
  userAccount: UserAccountRecord;
};

export class SessionRecord {
  public data: SessionBaseData | SessionPersistedData;

  public constructor(data: SessionBaseData | SessionPersistedData) {
    this.data = data;
  }

  public async create(): Promise<SessionRecord> {
    const record = await prisma.session.create({
      data: {
        userAccountId: this.data.userAccountId,
        sessionTokenHash: this.data.sessionTokenHash,
        expiresAt: this.data.expiresAt,
      },
    });

    return SessionRecord.fromRecord(record);
  }

  public async delete(): Promise<void> {
    await prisma.session.delete({
      where: {
        id: this.persistedId,
      },
    });
  }

  public get persistedId(): string {
    if (!("id" in this.data) || !this.data.id) {
      throw new Error("session_id_required");
    }

    return this.data.id;
  }

  public static async findByTokenHashWithUserAccount(
    sessionTokenHash: string,
  ): Promise<SessionWithUserAccountRecord | null> {
    return prisma.session.findUnique({
      where: {
        sessionTokenHash,
      },
      include: {
        userAccount: true,
      },
    });
  }

  public static async deleteByTokenHash(sessionTokenHash: string): Promise<void> {
    await prisma.session.deleteMany({
      where: {
        sessionTokenHash,
      },
    });
  }

  private static fromRecord(record: SessionPersistedData): SessionRecord {
    return new SessionRecord(record);
  }
}
