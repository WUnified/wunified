import { expect, test, type Page } from '@playwright/test';

const PASSWORD = 'wunified-test-password';
const MAYA_EMAIL = 'maya.thompson@example.test';

function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

async function logIn(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByPlaceholder('Email').fill(MAYA_EMAIL);
  await page.getByPlaceholder('Password').fill(PASSWORD);
  await page.getByText('Log in', { exact: true }).last().click();
  await expect(page.getByPlaceholder('Email')).toBeHidden();
}

async function signUp(page: Page): Promise<void> {
  const suffix = uniqueSuffix();
  await page.goto('/');
  await page.getByText('Create an account').click();
  // The login screen stays mounted behind signup, so only the visible field is the target.
  await page.getByPlaceholder('Username').fill(`e2e_${suffix}`);
  await page.getByPlaceholder('Email').locator('visible=true').fill(`e2e-${suffix}@example.test`);
  await page.getByPlaceholder('Password').locator('visible=true').fill(PASSWORD);
  await page.getByText('Create account', { exact: true }).locator('visible=true').last().click();
}

async function openTab(page: Page, name: string): Promise<void> {
  await page.getByRole('tab', { name }).click();
}

// A failed save leaves the typed text on screen, in the input or the still-open form, so a
// journey only proves something was saved if it survives a reload from the server.
async function expectSavedAfterReload(page: Page, text: string): Promise<void> {
  await page.reload();
  await expect(page.getByText(text).first()).toBeVisible();
}

async function attachPhoto(page: Page, buttonName: string): Promise<void> {
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: buttonName, exact: true }).click();
  await (await chooser).setFiles('assets/favicon.png');
}

async function publishPost(page: Page, title: string): Promise<void> {
  await openTab(page, 'Home');
  await page.getByRole('button', { name: 'Create a post' }).click();
  await page.getByLabel('Post title').fill(title);
  await page.getByLabel('Post message').fill('Published by an end-to-end test.');
  await page.getByRole('button', { name: 'Post', exact: true }).click();
  await expect(page.getByLabel('Post title')).toBeHidden();
}

async function createEvent(page: Page, title: string): Promise<void> {
  await openTab(page, 'Community');
  await page.getByLabel('Create event').click();
  await page.getByLabel('Title', { exact: true }).fill(title);
  await page.getByLabel('Description', { exact: true }).fill('Created by an end-to-end test.');
  await page.getByLabel('Location', { exact: true }).fill(`Hall ${title}`);
  await page.getByLabel('Start date', { exact: true }).fill('2099-03-01');
  await page.getByLabel('Start time', { exact: true }).fill('10:00');
  await page.getByRole('button', { name: 'Submit new event' }).click();
  await expect(page.getByRole('button', { name: `RSVP for ${title}` })).toBeVisible();
}

async function startChatWith(page: Page, username: string, person: RegExp): Promise<void> {
  await openTab(page, 'Chat');
  await page.getByRole('button', { name: 'New message' }).click();
  await page.getByLabel('Search by username').fill(username);
  await page.getByRole('checkbox', { name: person }).click();
}

async function sendMessage(page: Page, message: string): Promise<void> {
  const composer = page.getByLabel('Message', { exact: true });
  await composer.fill(message);
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(composer).toHaveValue('');
  await expectSavedAfterReload(page, message);
}

test('a signed-out visitor is sent to log in, then signs up and reaches the app', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByPlaceholder('Email')).toBeVisible();
  await expect(page.getByPlaceholder('Search listings...')).toBeHidden();

  await signUp(page);

  await openTab(page, 'Marketplace');
  await expect(page.getByPlaceholder('Search listings...')).toBeVisible();
});

test('a wrong password shows the error and stays on the login screen', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Email').fill(MAYA_EMAIL);
  await page.getByPlaceholder('Password').fill('not-the-password');
  await page.getByText('Log in', { exact: true }).last().click();

  await expect(page.getByText(/invalid login credentials/i)).toBeVisible();
  await expect(page.getByPlaceholder('Email')).toBeVisible();
});

test('a user edits their profile and signs out', async ({ page }) => {
  const displayName = `E2E ${uniqueSuffix()}`;
  await signUp(page);
  await openTab(page, 'Profile');

  await page.getByRole('button', { name: 'Edit profile' }).click();
  await page.getByLabel('Display name').fill(displayName);
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByRole('button', { name: 'Save profile' })).toBeHidden();
  await expectSavedAfterReload(page, displayName);

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByPlaceholder('Email').locator('visible=true')).toBeVisible();
});

test('a seller publishes a listing and finds it in the feed', async ({ page }) => {
  const title = `E2E lamp ${uniqueSuffix()}`;
  await logIn(page);
  await openTab(page, 'Marketplace');

  await page.getByLabel('Create listing').click();
  await page.getByLabel('Listing title').fill(title);
  await page.getByLabel('Listing description').fill('Published by an end-to-end test.');
  await page.getByLabel('Listing price').fill('15');
  await page.getByRole('button', { name: 'Publish listing' }).click();

  await expect(page.getByLabel('Listing title')).toBeHidden();
  await page.reload();
  await page.getByLabel('Search listings').fill(title);
  // A listing can appear in both the trending row and the grid.
  await expect(page.getByRole('button', { name: `View ${title}` }).first()).toBeVisible();
});

test('a buyer messages a seller from a listing', async ({ page }) => {
  const message = `Is this still available? ${uniqueSuffix()}`;
  await logIn(page);
  await openTab(page, 'Marketplace');

  await page.getByLabel('Search listings').fill('Desk lamp with warm LED bulb');
  await page.getByRole('button', { name: 'View Desk lamp with warm LED bulb' }).first().click();
  await page.getByRole('button', { name: 'Message seller' }).click();

  await sendMessage(page, message);
});

test('a user replies from the chat inbox', async ({ page }) => {
  const message = `Reply ${uniqueSuffix()}`;
  await logIn(page);
  await openTab(page, 'Chat');

  await page
    .getByRole('button', { name: /Jordan Lee/ })
    .first()
    .click();

  await sendMessage(page, message);
});

test('a user publishes a community post', async ({ page }) => {
  const title = `E2E post ${uniqueSuffix()}`;
  await logIn(page);

  await publishPost(page, title);

  await expectSavedAfterReload(page, title);
});

test('a user comments on a post', async ({ page }) => {
  const title = `E2E comments ${uniqueSuffix()}`;
  const comment = `A comment ${uniqueSuffix()}`;
  await logIn(page);
  await publishPost(page, title);
  // The feed is newest first, so the first card is the post just published.
  await expect(page.getByText(title)).toBeVisible();

  await page.getByRole('button', { name: 'Show comments' }).first().click();
  await page.getByLabel('Write a comment').fill(comment);
  await page.getByRole('button', { name: 'Send comment' }).click();
  await expect(page.getByLabel('Write a comment')).toHaveValue('');

  await page.reload();
  await page.getByRole('button', { name: 'Show comments' }).first().click();
  await expect(page.getByText(comment)).toBeVisible();
});

test('a user creates an event, RSVPs, and cancels', async ({ page }) => {
  const title = `E2E event ${uniqueSuffix()}`;
  await logIn(page);
  await createEvent(page, title);

  await page.getByRole('button', { name: `RSVP for ${title}` }).click();
  await expect(page.getByRole('button', { name: `Cancel RSVP for ${title}` })).toBeVisible();

  await page.reload();
  await page.getByRole('tab', { name: 'My Events' }).click();
  await page.getByRole('button', { name: `Cancel RSVP for ${title}` }).click();
  await expect(page.getByRole('button', { name: `Cancel RSVP for ${title}` })).toBeHidden();

  await page.reload();
  await page.getByRole('tab', { name: 'My Events' }).click();
  await expect(page.getByRole('button', { name: new RegExp(title) })).toHaveCount(0);
});

test('a user filters events by location', async ({ page }) => {
  const title = `E2E filtered ${uniqueSuffix()}`;
  await logIn(page);
  await createEvent(page, title);

  await page
    .getByRole('button', { name: /filter/i })
    .first()
    .click();
  await page.getByLabel('Filter by location').fill('A place with no events');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page.getByRole('button', { name: `RSVP for ${title}` })).toBeHidden();

  await page
    .getByRole('button', { name: /filter/i })
    .first()
    .click();
  await page.getByLabel('Filter by location').fill(`Hall ${title}`);
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page.getByRole('button', { name: `RSVP for ${title}` })).toBeVisible();
});

test('a session survives a reload, and signing back in works', async ({ page }) => {
  await logIn(page);
  await page.reload();
  await expect(page.getByPlaceholder('Email')).toBeHidden();

  await openTab(page, 'Profile');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByPlaceholder('Email').locator('visible=true')).toBeVisible();

  await logIn(page);
  await openTab(page, 'Profile');
  await expect(page.getByText('maya_t').first()).toBeVisible();
});

test('browsing filters listings by category', async ({ page }) => {
  await logIn(page);
  await openTab(page, 'Marketplace');
  const tickets = page.getByRole('button', { name: 'View Two concert tickets near campus' });
  const textbooks = page.getByRole('button', { name: 'View Calculus II textbook bundle' });

  await page.getByRole('button', { name: 'Tickets', exact: true }).click();
  await expect(tickets.first()).toBeVisible();
  await expect(textbooks).toHaveCount(0);

  await page.getByRole('button', { name: 'Textbooks', exact: true }).click();
  await expect(textbooks.first()).toBeVisible();
  await expect(tickets).toHaveCount(0);
});

test('sorting by price orders search results lowest first', async ({ page }) => {
  await logIn(page);
  await openTab(page, 'Marketplace');
  await page.getByLabel('Search listings').fill('lamp');

  await page.getByLabel('Sort listings').click();
  await page.getByRole('button', { name: 'Price: low to high' }).click();

  // The results repeat as a "Recently listed" row above the sorted grid.
  await expect(async () => {
    const prices = (await page.getByText(/^\$\d/).allTextContents()).map((text) =>
      Number(text.replace(/[^0-9.]/g, '')),
    );
    const grid = prices.slice(prices.length / 2);
    expect(grid.length).toBeGreaterThan(0);
    expect(grid).toEqual([...grid].sort((left, right) => left - right));
  }).toPass();
});

test('a seller publishes a listing with a photo', async ({ page }) => {
  const title = `E2E photo ${uniqueSuffix()}`;
  await logIn(page);
  await openTab(page, 'Marketplace');

  await page.getByLabel('Create listing').click();
  await page.getByLabel('Listing title').fill(title);
  await page.getByLabel('Listing description').fill('Published with a photo.');
  await page.getByLabel('Listing price').fill('20');
  await attachPhoto(page, 'Add photo');
  await expect(page.getByLabel('Listing photo 1')).toBeVisible();
  await page.getByRole('button', { name: 'Publish listing' }).click();
  await expect(page.getByLabel('Listing title')).toBeHidden();

  await page.reload();
  await page.getByLabel('Search listings').fill(title);
  await expect(page.getByRole('img', { name: title }).first()).toBeVisible();
});

test('a user starts a direct chat from the new message screen', async ({ page }) => {
  const message = `Hello ${uniqueSuffix()}`;
  await logIn(page);

  await startChatWith(page, 'sam', /Samir Patel/);
  await page.getByRole('button', { name: 'Message Samir' }).click();

  await sendMessage(page, message);
});

test('a user creates a group chat', async ({ page }) => {
  const groupName = `E2E group ${uniqueSuffix()}`;
  const message = `Hello group ${uniqueSuffix()}`;
  await logIn(page);

  await startChatWith(page, 'sam', /Samir Patel/);
  await page.getByLabel('Search by username').fill('jor');
  await page.getByRole('checkbox', { name: /Jordan Lee/ }).click();
  await page.getByLabel('Group name, optional').fill(groupName);
  await page.getByRole('button', { name: 'Create group (3)' }).click();

  await sendMessage(page, message);
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByText(groupName).first()).toBeVisible();
});

test('a user sends a photo in a chat', async ({ page }) => {
  await logIn(page);
  await openTab(page, 'Chat');
  await page
    .getByRole('button', { name: /Jordan Lee/ })
    .first()
    .click();

  await attachPhoto(page, 'Add photo');
  await expect(page.getByLabel(/Attached photo/)).toBeVisible();
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByLabel(/Attached photo/)).toBeHidden();

  await page.reload();
  await expect(page.getByLabel(/^Photo/).last()).toBeVisible();
});

test('a user searches the inbox and opens the marketplace folder', async ({ page }) => {
  await logIn(page);
  await openTab(page, 'Chat');

  await page.getByLabel('Search chats').fill('Jordan');
  await expect(page.getByRole('button', { name: /Jordan Lee/ }).first()).toBeVisible();
  await page.getByLabel('Search chats').fill('');

  await page.getByRole('button', { name: /^Marketplace,/ }).click();
  await expect(page.getByText(/Jordan Lee · Desk lamp with warm LED bulb/)).toBeVisible();
});
