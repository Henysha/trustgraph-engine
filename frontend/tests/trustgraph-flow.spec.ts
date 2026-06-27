import { expect, type Page, test } from "@playwright/test";

test("TrustGraph Engine full UI risk flow", async ({ page }) => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const lowUser = `E2E Low User ${suffix}`;
  const highUser = `E2E High User ${suffix}`;
  const stableGroup = `E2E Stable Group ${suffix}`;
  const riskyGroup = `E2E Risky Group ${suffix}`;

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "TrustGraph Engine" })).toBeVisible();

  await page.getByTestId("desktop-nav-users").click();
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();

  await createUser(page, {
    externalId: `e2e-low-user-${suffix}`,
    fullName: lowUser,
    email: `low-${suffix}@example.com`,
    accountAge: "240",
    contributions: "14",
    failedTransactions: "0",
    successfulRepayments: "7",
    reputation: "92",
  });

  await createUser(page, {
    externalId: `e2e-high-user-${suffix}`,
    fullName: highUser,
    email: `high-${suffix}@example.com`,
    accountAge: "4",
    contributions: "0",
    failedTransactions: "3",
    successfulRepayments: "0",
    reputation: "25",
  });

  await expect(page.getByTestId("user-row").filter({ hasText: lowUser })).toBeVisible();
  await expect(page.getByTestId("user-row").filter({ hasText: highUser })).toBeVisible();

  await page.getByTestId("desktop-nav-groups").click();
  await expect(page.getByRole("heading", { name: "Groups" })).toBeVisible();

  await createGroup(page, {
    externalId: `e2e-stable-group-${suffix}`,
    name: stableGroup,
    members: "32",
    defaultRate: "0.0200",
    suspiciousCount: "0",
  });

  await createGroup(page, {
    externalId: `e2e-risky-group-${suffix}`,
    name: riskyGroup,
    members: "9",
    defaultRate: "0.2200",
    suspiciousCount: "3",
  });

  await expect(page.getByTestId("group-row").filter({ hasText: stableGroup })).toBeVisible();
  await expect(page.getByTestId("group-row").filter({ hasText: riskyGroup })).toBeVisible();

  await page.getByTestId("desktop-nav-transactions").click();
  await expect(page.getByRole("heading", { name: "Transactions" })).toBeVisible();

  await createTransaction(page, {
    user: lowUser,
    group: stableGroup,
    type: "CONTRIBUTION",
    amount: "50.00",
  });

  const lowTransactionRow = page
    .getByTestId("transaction-row")
    .filter({ hasText: lowUser })
    .filter({ hasText: "CONTRIBUTION" })
    .filter({ hasText: "50.00" });
  await expect(lowTransactionRow).toBeVisible();
  await lowTransactionRow.getByTestId("score-transaction").click();
  await expect(page.getByTestId("latest-score")).toContainText("LOW");
  await expect(page.getByTestId("latest-score")).toContainText("APPROVE");

  await createTransaction(page, {
    user: highUser,
    group: riskyGroup,
    type: "FUNDING_REQUEST",
    amount: "2500.00",
  });

  const highTransactionRow = page
    .getByTestId("transaction-row")
    .filter({ hasText: highUser })
    .filter({ hasText: "FUNDING_REQUEST" })
    .filter({ hasText: "2500.00" });
  await expect(highTransactionRow).toBeVisible();
  const highTransactionId = await highTransactionRow.getAttribute("data-transaction-id");
  expect(highTransactionId, "high-risk transaction id should be present").toBeTruthy();

  await highTransactionRow.getByTestId("score-transaction").click();
  await expect(page.getByTestId("latest-score")).toContainText("HIGH");
  await expect(page.getByTestId("latest-score")).toContainText("BLOCK");

  await page.getByTestId("desktop-nav-alerts").click();
  await expect(page.getByRole("heading", { name: "Fraud Alerts" })).toBeVisible();

  const alertCard = page
    .getByTestId("alert-card")
    .filter({ hasText: `Transaction #${highTransactionId}` });
  await expect(alertCard).toContainText("HIGH");
  await expect(alertCard).toContainText("OPEN");

  page.once("dialog", async (dialog) => {
    await dialog.accept(`E2E resolved alert ${suffix}`);
  });
  await alertCard.getByTestId("resolve-alert").click();
  await expect(alertCard).toContainText("RESOLVED");

  await page.getByTestId("desktop-nav-review-cases").click();
  await expect(page.getByRole("heading", { name: "Review Cases" })).toBeVisible();

  const reviewCaseCard = page
    .getByTestId("review-case-card")
    .filter({ hasText: `Transaction #${highTransactionId}` });
  await expect(reviewCaseCard).toContainText("OPEN");

  page.once("dialog", async (dialog) => {
    await dialog.accept(`E2E rejected case ${suffix}`);
  });
  await reviewCaseCard.getByTestId("reject-review-case").click();
  await expect(reviewCaseCard).toContainText("REJECTED");
  await expect(reviewCaseCard).toContainText(`E2E rejected case ${suffix}`);
});

async function createUser(
  page: Page,
  user: {
    externalId: string;
    fullName: string;
    email: string;
    accountAge: string;
    contributions: string;
    failedTransactions: string;
    successfulRepayments: string;
    reputation: string;
  },
) {
  await page.getByTestId("user-external-id").fill(user.externalId);
  await page.getByTestId("user-full-name").fill(user.fullName);
  await page.getByTestId("user-email").fill(user.email);
  await page.getByTestId("user-account-age").fill(user.accountAge);
  await page.getByTestId("user-contributions").fill(user.contributions);
  await page.getByTestId("user-failed-transactions").fill(user.failedTransactions);
  await page.getByTestId("user-successful-repayments").fill(user.successfulRepayments);
  await page.getByTestId("user-reputation").fill(user.reputation);

  const postUser = page.waitForResponse(
    (response) =>
      response.url().includes("/api/users") && response.request().method() === "POST",
  );
  const refreshedUsers = page.waitForResponse(
    (response) =>
      response.url().includes("/api/users") &&
      response.request().method() === "GET" &&
      response.status() === 200,
  );

  await page.getByTestId("create-user-submit").click();

  const postResponse = await postUser;
  expect(postResponse.status(), `POST /api/users failed: ${await postResponse.text()}`).toBe(201);

  const getResponse = await refreshedUsers;
  expect(getResponse.ok(), `GET /api/users failed: ${await getResponse.text()}`).toBeTruthy();

  await expect(page.getByTestId("user-row").filter({ hasText: user.fullName })).toBeVisible();
}

async function createGroup(
  page: Page,
  group: {
    externalId: string;
    name: string;
    members: string;
    defaultRate: string;
    suspiciousCount: string;
  },
) {
  await page.getByTestId("group-external-id").fill(group.externalId);
  await page.getByTestId("group-name").fill(group.name);
  await page.getByTestId("group-member-count").fill(group.members);
  await page.getByTestId("group-default-rate").fill(group.defaultRate);
  await page.getByTestId("group-suspicious-count").fill(group.suspiciousCount);
  await page.getByTestId("create-group-submit").click();
  await expect(page.getByTestId("group-row").filter({ hasText: group.name })).toBeVisible();
}

async function createTransaction(
  page: Page,
  transaction: {
    user: string;
    group: string;
    type: string;
    amount: string;
  },
) {
  await page.getByTestId("transaction-user").selectOption({ label: transaction.user });
  await page.getByTestId("transaction-group").selectOption({ label: transaction.group });
  await page.getByTestId("transaction-type").selectOption(transaction.type);
  await page.getByTestId("transaction-amount").fill(transaction.amount);
  await page.getByTestId("transaction-currency").fill("USD");
  await page.getByTestId("create-transaction-submit").click();
  await expect(
    page
      .getByTestId("transaction-row")
      .filter({ hasText: transaction.user })
      .filter({ hasText: transaction.type })
      .filter({ hasText: transaction.amount }),
  ).toBeVisible();
}
