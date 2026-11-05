import { StyleSheet } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Fonts, Typography } from '../../../constants/typography';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
  authorRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: Colors.subtle,
    borderRadius: Radius.full,
    height: 40,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 40,
  },
  avatarInitial: {
    ...Typography.bodyStrong,
    color: Colors.primary,
  },
  avatarImage: {
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
  authorDetails: {
    flex: 1,
    marginLeft: 10,
  },
  authorNameRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  authorName: {
    ...Typography.bodyStrong,
    color: Colors.text,
    flexShrink: 1,
  },
  verified: {
    color: Colors.primary,
    fontFamily: Fonts.bold,
    fontSize: 13,
    marginLeft: 5,
  },
  postTime: {
    ...Typography.caption,
    color: Colors.textDim,
    marginTop: 1,
  },
  title: {
    ...Typography.cardTitle,
    color: Colors.text,
    marginTop: 14,
  },
  body: {
    ...Typography.body,
    color: Colors.text,
    marginTop: 5,
  },
  actions: {
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 10,
  },
  commentAction: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 36,
    paddingHorizontal: 2,
  },
  commentIcon: {
    color: Colors.textDim,
    fontFamily: Fonts.body,
    fontSize: 18,
    marginRight: 7,
  },
  commentActionText: {
    ...Typography.caption,
    color: Colors.textDim,
  },
  commentsSection: {
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
    paddingTop: 12,
  },
  commentState: {
    ...Typography.caption,
    color: Colors.textDim,
    paddingVertical: 6,
  },
  commentError: {
    ...Typography.caption,
    color: Colors.danger,
    paddingVertical: 6,
  },
  commentLink: {
    ...Typography.caption,
    color: Colors.primary,
    paddingVertical: 8,
  },
  commentRow: {
    marginBottom: 10,
  },
  commentAuthor: {
    ...Typography.caption,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  commentBody: {
    ...Typography.caption,
    color: Colors.textDim,
    marginTop: 2,
  },
  commentComposer: {
    alignItems: 'center',
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 6,
    paddingHorizontal: 12,
  },
  commentInput: {
    ...Typography.caption,
    color: Colors.text,
    flex: 1,
    minHeight: 42,
  },
  pressed: {
    opacity: 0.75,
  },
});
