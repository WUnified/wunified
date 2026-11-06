export const TAB_BAR_HEIGHT = 70;
export const TAB_BAR_BOTTOM_OFFSET = 12;

export function getTabBarContentClearance(bottomInset: number): number {
  return bottomInset + TAB_BAR_BOTTOM_OFFSET + TAB_BAR_HEIGHT;
}
