import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from './NewChatScreen.styles';
import { IconButton } from '../../../components/IconButton';
import { Colors } from '../../../constants/colors';
import { ChatSearchBar } from '../components/ChatSearchBar';
import { SelectedUserChip } from '../components/SelectedUserChip';
import { UserSearchResultRow } from '../components/UserSearchResultRow';
import { useChatUserSearch, useCreateDirectChat, useCreateGroupChat } from '../hooks';
import { defaultGroupTitle } from '../presentation';
import type { SearchableChatUser } from '../types';

const backIcon = require('../../../../assets/back-icon.png') as ImageSourcePropType;

export function NewChatScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  // Selected people are kept as objects so their chips stay visible after the search changes.
  const [selected, setSelected] = useState<SearchableChatUser[]>([]);
  const [groupName, setGroupName] = useState('');
  const search = useChatUserSearch(query);
  const createDirect = useCreateDirectChat();
  const createGroup = useCreateGroupChat();

  const saving = createDirect.saving || createGroup.saving;
  const isGroup = selected.length > 1;
  const selectedIds = new Set(selected.map((user) => user.userId));

  function toggle(user: SearchableChatUser) {
    setSelected((current) =>
      current.some((item) => item.userId === user.userId)
        ? current.filter((item) => item.userId !== user.userId)
        : [...current, user],
    );
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/chat');
  }

  async function start() {
    if (selected.length === 0 || saving) return;
    const chat = isGroup
      ? await createGroup.submit({
          title: groupName.trim() || defaultGroupTitle(selected.map((user) => user.displayName)),
          initialMemberIds: selected.map((user) => user.userId),
        })
      : await createDirect.submit({ otherUserId: selected[0].userId });
    // Replace rather than push, so Back from the new chat returns to the inbox.
    if (chat) router.replace({ pathname: '/conversation/[chatId]', params: { chatId: chat.id } });
  }

  const actionLabel = isGroup
    ? `Create group (${selected.length + 1})`
    : selected.length === 1
      ? `Message ${selected[0].displayName.split(/\s+/)[0]}`
      : 'Select someone';
  const error = createDirect.error ?? createGroup.error;

  function renderEmpty() {
    if (!search.canSearch) {
      return <Text style={styles.hint}>Type at least 2 letters of a username.</Text>;
    }
    if (search.loading) return <ActivityIndicator color={Colors.primary} style={styles.hint} />;
    if (search.error) {
      return (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {search.error}
        </Text>
      );
    }
    return <Text style={styles.hint}>No one matches “{query.trim()}”.</Text>;
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <IconButton accessibilityLabel="Back" iconSource={backIcon} onPress={goBack} />
        <Text accessibilityRole="header" style={styles.title}>
          New message
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.body}
      >
        <View style={styles.controls}>
          <ChatSearchBar onChangeText={setQuery} placeholder="Search by username" value={query} />
          {selected.length > 0 ? (
            <ScrollView contentContainerStyle={styles.chips} horizontal>
              {selected.map((user) => (
                <SelectedUserChip
                  key={user.userId}
                  name={user.displayName}
                  onRemove={() => toggle(user)}
                />
              ))}
            </ScrollView>
          ) : null}
          {isGroup ? (
            <TextInput
              accessibilityLabel="Group name, optional"
              editable={!saving}
              maxLength={160}
              onChangeText={setGroupName}
              placeholder={`Group name (default: ${defaultGroupTitle(selected.map((user) => user.displayName))})`}
              placeholderTextColor={Colors.textDim}
              style={styles.groupInput}
              value={groupName}
            />
          ) : null}
        </View>

        <FlatList
          data={search.results}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(user) => user.userId}
          ListEmptyComponent={renderEmpty()}
          renderItem={({ item }) => (
            <UserSearchResultRow
              onPress={() => toggle(item)}
              selected={selectedIds.has(item.userId)}
              user={item}
            />
          )}
          style={styles.results}
        />

        <View style={styles.footer}>
          {error ? (
            <Text accessibilityRole="alert" style={styles.errorText}>
              {error}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: selected.length === 0 || saving }}
            disabled={selected.length === 0 || saving}
            onPress={() => void start()}
            style={({ pressed }) => [
              styles.button,
              (selected.length === 0 || saving) && styles.buttonDisabled,
              pressed && styles.pressed,
            ]}
          >
            {saving ? (
              <ActivityIndicator color={Colors.onPrimary} />
            ) : (
              <Text style={styles.buttonLabel}>{actionLabel}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
