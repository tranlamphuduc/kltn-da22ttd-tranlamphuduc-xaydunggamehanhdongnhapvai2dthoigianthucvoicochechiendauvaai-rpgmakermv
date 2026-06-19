# KIỂM TRA SCRIPT POSE

## Script cần dùng trong Move Route:

### Cách 1: Dùng playPose (QSprite)
```javascript
this.playPose("attack", true);
```

### Cách 2: Dùng requestAnimation (Đơn giản hơn)
```javascript
this.requestAnimation(116);
```

### Cách 3: Dùng Show Animation command (Không cần script)
Thay vì dùng Script trong Move Route, dùng:
- **Show Animation**: Lính 1, Animation ID 116

---

## KIỂM TRA CHARACTER SHEET

Event "Lính 1" đang dùng character nào?
- Nếu dùng character sheet thường (VD: Actor1.png) → KHÔNG có pose system
- Nếu dùng QSprite sheet (VD: %Actor1 với folder poses) → CÓ pose system

**Cách check**: Xem tên character trong Event:
- Nếu có dấu `%` ở đầu → QSprite character
- Nếu không → Character thường

---

## GIẢI PHÁP CHẮC CHẮN HOẠT ĐỘNG

Thay vì dùng `playPose()`, dùng **Show Animation** command:

```
◆Set Movement Route: [Lính 1] (Wait)
  ◆Turn Right

◆Show Animation: [Lính 1], [116:Attack Animation]
◆Play SE: Gun2 (65, 100, -60)

◆Wait: 30 frames

◆Set Movement Route: [Lính 1]
  ◆Turn Left (quay về vị trí ban đầu)
```

Cách này **100% hoạt động** với mọi character!
