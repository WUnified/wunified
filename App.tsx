import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import HomeScreen from './app/tabs/home';

const styles = StyleSheet.create({ 
  safeArea: { //padding to not overlap with ios status bar
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  container: { // Main container for the app
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  topBar: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingTop: 10,
    paddingBottom: 10,
  },
  topButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  topButtonLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderTopWidth: 1,
    borderTopColor: '#444',
    paddingBottom: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  tabLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default function App() { // Main App component
  return ( //temp buttons a
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topButton}>
            <Text style={styles.topButtonLabel}>Button 1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topButton}>
            <Text style={styles.topButtonLabel}>Button 2</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topButton}>
            <Text style={styles.topButtonLabel}>Button 3</Text>
          </TouchableOpacity>
        </View>
        <HomeScreen />
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabLabel}>Tab 1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabLabel}>Tab 2</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabLabel}>Tab 3</Text>
          </TouchableOpacity>
        </View>
        <StatusBar style="light" />
      </View>
    </SafeAreaView>
  );
}
