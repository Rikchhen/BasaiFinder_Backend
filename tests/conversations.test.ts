import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app";
import { registerUser } from "./helpers";

async function chatFixture() {
  const landlord = await registerUser("landlord");
  const tenant = await registerUser("tenant");

  const res = await request(app)
    .post("/api/conversations")
    .set("Cookie", tenant.cookie)
    .send({ recipient: landlord.id, text: "Is this room available?" });

  return { landlord, tenant, conversation: res.body.conversation, status: res.status };
}

describe("conversations", () => {
  it("creates a conversation with an opening message", async () => {
    const { status, conversation } = await chatFixture();

    expect(status).toBe(201);
    expect(conversation.participants).toHaveLength(2);
  });

  it("reuses the existing conversation instead of duplicating it", async () => {
    const { tenant, landlord, conversation } = await chatFixture();

    const again = await request(app)
      .post("/api/conversations")
      .set("Cookie", tenant.cookie)
      .send({ recipient: landlord.id, text: "Following up" });

    expect(again.body.conversation._id).toBe(conversation._id);
  });

  it("refuses a conversation with yourself", async () => {
    const tenant = await registerUser("tenant");

    const res = await request(app)
      .post("/api/conversations")
      .set("Cookie", tenant.cookie)
      .send({ recipient: tenant.id });

    expect(res.status).toBe(400);
  });

  it("reports an unread count for the recipient only", async () => {
    const { landlord, tenant, conversation } = await chatFixture();

    const landlordList = await request(app).get("/api/conversations").set("Cookie", landlord.cookie);
    const tenantList = await request(app).get("/api/conversations").set("Cookie", tenant.cookie);

    const landlordThread = landlordList.body.conversations.find(
      (c: { _id: string }) => c._id === conversation._id,
    );
    const tenantThread = tenantList.body.conversations.find(
      (c: { _id: string }) => c._id === conversation._id,
    );

    // The sender has effectively read their own message.
    expect(landlordThread.unreadCount).toBe(1);
    expect(tenantThread.unreadCount).toBe(0);
  });

  it("clears the unread count once the thread is marked read", async () => {
    const { landlord, conversation } = await chatFixture();

    await request(app)
      .patch(`/api/conversations/${conversation._id}/read`)
      .set("Cookie", landlord.cookie);

    const list = await request(app).get("/api/conversations").set("Cookie", landlord.cookie);
    const thread = list.body.conversations.find((c: { _id: string }) => c._id === conversation._id);

    expect(thread.unreadCount).toBe(0);
  });

  it("hides messages from a non-participant", async () => {
    const { conversation } = await chatFixture();
    const stranger = await registerUser("tenant");

    const res = await request(app)
      .get(`/api/conversations/${conversation._id}/messages`)
      .set("Cookie", stranger.cookie);

    expect(res.status).toBe(404);
  });

  it("stops a non-participant from posting into the thread", async () => {
    const { conversation } = await chatFixture();
    const stranger = await registerUser("landlord");

    const res = await request(app)
      .post(`/api/conversations/${conversation._id}/messages`)
      .set("Cookie", stranger.cookie)
      .send({ text: "let me in" });

    expect(res.status).toBe(404);
  });

  it("rejects an empty message", async () => {
    const { tenant, conversation } = await chatFixture();

    const res = await request(app)
      .post(`/api/conversations/${conversation._id}/messages`)
      .set("Cookie", tenant.cookie)
      .send({ text: "   " });

    expect(res.status).toBe(400);
  });

  it("hides a deleted chat from the deleter but not the other participant", async () => {
    const { landlord, tenant, conversation } = await chatFixture();

    const del = await request(app)
      .delete(`/api/conversations/${conversation._id}`)
      .set("Cookie", landlord.cookie);
    expect(del.status).toBe(204);

    const landlordList = await request(app).get("/api/conversations").set("Cookie", landlord.cookie);
    const tenantList = await request(app).get("/api/conversations").set("Cookie", tenant.cookie);

    expect(landlordList.body.conversations).toHaveLength(0);
    expect(tenantList.body.conversations).toHaveLength(1);
  });

  it("hides cleared history from the deleter while the other side keeps it", async () => {
    const { landlord, tenant, conversation } = await chatFixture();

    await request(app)
      .delete(`/api/conversations/${conversation._id}`)
      .set("Cookie", landlord.cookie);

    const landlordMessages = await request(app)
      .get(`/api/conversations/${conversation._id}/messages`)
      .set("Cookie", landlord.cookie);
    const tenantMessages = await request(app)
      .get(`/api/conversations/${conversation._id}/messages`)
      .set("Cookie", tenant.cookie);

    expect(landlordMessages.body.messages).toHaveLength(0);
    expect(tenantMessages.body.messages).toHaveLength(1);
  });

  it("brings a deleted chat back when the other side writes again, without old history", async () => {
    const { landlord, tenant, conversation } = await chatFixture();

    await request(app)
      .delete(`/api/conversations/${conversation._id}`)
      .set("Cookie", landlord.cookie);

    await request(app)
      .post(`/api/conversations/${conversation._id}/messages`)
      .set("Cookie", tenant.cookie)
      .send({ text: "are you still there?" });

    const list = await request(app).get("/api/conversations").set("Cookie", landlord.cookie);
    const messages = await request(app)
      .get(`/api/conversations/${conversation._id}/messages`)
      .set("Cookie", landlord.cookie);

    expect(list.body.conversations).toHaveLength(1);
    // Only the message sent after the delete is visible.
    expect(messages.body.messages).toHaveLength(1);
    expect(messages.body.messages[0].text).toBe("are you still there?");
  });

  it("stops a non-participant from deleting the thread", async () => {
    const { conversation } = await chatFixture();
    const stranger = await registerUser("tenant");

    const res = await request(app)
      .delete(`/api/conversations/${conversation._id}`)
      .set("Cookie", stranger.cookie);

    expect(res.status).toBe(404);
  });

  it("returns messages oldest-first for the thread view", async () => {
    const { tenant, conversation } = await chatFixture();

    await request(app)
      .post(`/api/conversations/${conversation._id}/messages`)
      .set("Cookie", tenant.cookie)
      .send({ text: "second" });

    const res = await request(app)
      .get(`/api/conversations/${conversation._id}/messages`)
      .set("Cookie", tenant.cookie);

    expect(res.body.messages).toHaveLength(2);
    expect(res.body.messages[1].text).toBe("second");
  });
});
