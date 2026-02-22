import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() { // This is a placeholder for the HomeScreen component
  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome to</Text>
      <Text style={styles.appNameText}>WUnified</Text>
    </View>
  );
}

const styles = StyleSheet.create({ // Styles for the HomeScreen component
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 45,
    fontWeight: 'bold',
    color: '#FFFF00',
  },
  appNameText: {
    fontSize: 45,
    fontWeight: 'bold',
    color: '#FFFF00',
  },
});
