import { prisma } from '../../../shared/config/database';

export class ChatRepository {
	// Chat Room operations
	createChatRoom(data: any) {
		return prisma.chatRoom.create({ data });
	}

	findChatRoomByRequestId(request_id: string) {
		return prisma.chatRoom.findUnique({
			where: { request_id },
			include: {
				request: {
					include: {
						docs: {
							where: { deleted_at: null },
							orderBy: [{ type: 'asc' }, { createdAt: 'desc' }]
						}
					}
				}
			}
		});
	}

	findChatRoomById(id: string) {
		return prisma.chatRoom.findUnique({
			where: { id },
			include: {
				request: {
					include: {
						docs: {
							where: { deleted_at: null },
							orderBy: [{ type: 'asc' }, { createdAt: 'desc' }]
						}
					}
				}
			}
		});
	}

	updateChatRoom(id: string, data: any) {
		return prisma.chatRoom.update({ where: { id }, data });
	}

	// Message operations
	createMessage(data: any) {
		return prisma.chatMessage.create({
			data,
			include: {
				sender: {
					select: {
						id: true,
						full_name: true,
						email: true,
						role: true
					}
				}
			}
		});
	}

	listMessages(chat_room_id: string, skip: number, take: number) {
		return prisma.chatMessage.findMany({
			where: { chat_room_id },
			orderBy: { createdAt: 'desc' },
			skip,
			take,
			include: {
				sender: {
					select: {
						id: true,
						full_name: true,
						email: true,
						role: true
					}
				}
			}
		});
	}

	countMessages(chat_room_id: string) {
		return prisma.chatMessage.count({ where: { chat_room_id } });
	}

	// User access control
	canUserAccessChatRoom(user_id: string, chat_room_id: string) {
		return prisma.chatRoom.findFirst({
			where: {
				id: chat_room_id
			},
			include: {
				request: true
			}
		});
	}

	// Get user's chat rooms
	getUserChatRooms(user_id: string, skip: number, take: number) {
		return prisma.chatRoom.findMany({
			where: {
				participants: {
					path: ['$[*]'],
					array_contains: user_id
				}
			},
			orderBy: { updatedAt: 'desc' },
			skip,
			take,
			include: {
				request: {
					select: {
						id: true,
						container_no: true,
						type: true,
						status: true,
						createdAt: true
					}
				},
				messages: {
					orderBy: { createdAt: 'desc' },
					take: 1,
					include: {
						sender: {
							select: {
								id: true,
								full_name: true
							}
						}
					}
				}
			}
		});
	}

	countUserChatRooms(user_id: string) {
		return prisma.chatRoom.count({
			where: {
				participants: {
					path: ['$[*]'],
					array_contains: user_id
				}
			}
		});
	}
}

export default new ChatRepository();
