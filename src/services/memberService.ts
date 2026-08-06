import { Member } from '../types';
import { repositories } from '../repositories';

export class MemberService {
  public static async addMember(newMbr: Member): Promise<void> {
    await repositories.members.save(newMbr);
  }

  public static async updateMember(updatedMbr: Member): Promise<void> {
    await repositories.members.save(updatedMbr);
  }

  public static async deleteMember(memberId: string): Promise<void> {
    await repositories.members.delete(memberId);
  }
}
