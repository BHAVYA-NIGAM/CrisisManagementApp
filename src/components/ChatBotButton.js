import React, { useRef, useState } from "react";
import { StyleSheet, View, TouchableOpacity, Animated, PanResponder, Dimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BUTTON_SIZE = 60;
const INITIAL_RIGHT = 16;
const INITIAL_BOTTOM = 80;

export const ChatBotButton = ({ onPress }) => {
  const pan = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH - INITIAL_RIGHT - BUTTON_SIZE, y: SCREEN_HEIGHT - INITIAL_BOTTOM - BUTTON_SIZE })).current;
  const [isDragging, setIsDragging] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [
          null,
          { dx: pan.x, dy: pan.y },
        ],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        setIsDragging(false);

        // If it was just a tap (minimal movement), trigger the onPress
        if (Math.abs(gesture.dx) < 5 && Math.abs(gesture.dy) < 5) {
          if (typeof onPress === "function") {
            onPress();
          }
        }

        // Constrain to screen bounds
        const finalX = Math.max(0, Math.min(pan.x._value, SCREEN_WIDTH - BUTTON_SIZE));
        const finalY = Math.max(0, Math.min(pan.y._value, SCREEN_HEIGHT - BUTTON_SIZE));

        Animated.spring(pan, {
          toValue: { x: finalX, y: finalY },
          useNativeDriver: false,
          friction: 7,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: pan.getTranslateTransform(),
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.button, isDragging && styles.buttonDragging]}>
        <MaterialCommunityIcons name="robot" size={30} color="#ffffff" />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    top: 0,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    zIndex: 1000,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  buttonDragging: {
    opacity: 0.8,
    transform: [{ scale: 1.1 }],
  },
});

