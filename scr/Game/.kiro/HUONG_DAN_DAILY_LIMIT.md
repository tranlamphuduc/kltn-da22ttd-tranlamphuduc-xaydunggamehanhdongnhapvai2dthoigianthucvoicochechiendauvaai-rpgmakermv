# HƯỚNG DẪN SỬ DỤNG DAILY LIMIT EVENTS

## VẤN ĐỀ: Event không hoạt động khi dùng `this.canLootToday()`

### NGUYÊN NHÂN
Trong RPG Maker MV, khi bạn dùng Script Call trong event, `this` không phải là event mà là `Game_Interpreter`.

Do đó `this.canLootToday()` sẽ **KHÔNG HOẠT ĐỘNG**.

---

## GIẢI PHÁP: Dùng `$gameMap.event(this._eventId)`

### CÁCH DÙNG ĐÚNG:

```javascript
// ❌ SAI - KHÔNG HOẠT ĐỘNG
this.canLootToday()

// ✅ ĐÚNG - HOẠT ĐỘNG
$gameMap.event(this._eventId).canLootToday()
```

---

## VÍ DỤ: EVENT LOOT RAU SỐNG (3 lần/ngày, reset mỗi ngày)

### 1. EVENT NOTE (Trang Event, không phải Item):
```
<dailyLimit: 3>
<dailyReset>
```

### 2. EVENT STRUCTURE:

**Page 1** (Graphic: Rau sống, No conditions):
```
◆Conditional Branch: Script: $gameMap.event(this._eventId).canLootToday()
  ◆Script: $gameMap.event(this._eventId).recordLoot();
  ◆Change Items: [0010:Rau sống] + 1
  ◆Text: Bạn đã nhặt được Rau sống!
  ◆Control Self Switch: A = ON
: Else
  ◆Text: Hôm nay bạn đã nhặt đủ rồi!
: Branch End
```

**Page 2** (Conditions: Self Switch A = ON):
- Graphic: None (để trống)
- Contents: (trống - event sẽ biến mất)

---

## CÁCH HOẠT ĐỘNG:

1. **Lần 1**: Player nhặt → Nhận Rau → Self Switch A = ON → Event biến mất
2. **Lần 2**: Qua ngày mới → `<dailyReset>` → Self Switch A = OFF → Event hiện lại
3. **Lần 3**: Player nhặt lần 2 → Event biến mất → Qua ngày → Hiện lại
4. **Lần 4**: Player nhặt lần 3 → Event biến mất → Qua ngày → Hiện lại
5. **Lần 5**: Player nhặt lần 4... (lặp lại mãi mãi)

---

## VÍ DỤ: EVENT CHỈ LOOT ĐƯỢC 3 LẦN VĨNH VIỄN (không reset)

### 1. EVENT NOTE:
```
<dailyLimit: 3>
```
(KHÔNG có `<dailyReset>`)

### 2. EVENT STRUCTURE:

**Page 1**:
```
◆Conditional Branch: Script: $gameMap.event(this._eventId).canLootToday()
  ◆Script: $gameMap.event(this._eventId).recordLoot();
  ◆Change Items: [0010:Rau sống] + 1
  ◆Text: Bạn đã nhặt được Rau sống!
  ◆Control Self Switch: A = ON
: Else
  ◆Text: Bạn đã lấy hết rồi!
: Branch End
```

**Page 2** (Conditions: Self Switch A = ON):
- (trống)

---

## VÍ DỤ: EVENT ERASE SAU KHI HẾT LIMIT VĨNH VIỄN

### 1. EVENT NOTE:
```
<dailyLimit: 3>
<dailyReset>
```

### 2. EVENT STRUCTURE:

**Page 1**:
```
◆Conditional Branch: Script: $gameMap.event(this._eventId).canLootToday()
  ◆Script: $gameMap.event(this._eventId).recordLoot();
  ◆Change Items: [0010:Rau sống] + 1
  ◆Text: Bạn đã nhặt được Rau sống!
  
  ◆Script: var ev = $gameMap.event(this._eventId);
  ◆Script: if (ev.getLootCount() >= ev.getDailyLimit()) {
  ◆Erase Event
  ◆Script: } else {
  ◆Control Self Switch: A = ON
  ◆Script: }
: Else
  ◆Text: Hôm nay đã lấy đủ rồi!
: Branch End
```

**Page 2** (Conditions: Self Switch A = ON):
- (trống)

### CÁCH HOẠT ĐỘNG:
1. Ngày 1: Loot 3 lần → Self Switch A = ON (biến mất)
2. Ngày 2: Reset → Hiện lại → Loot 3 lần → Self Switch A = ON
3. Ngày 3: Reset → Hiện lại → Loot 3 lần → **ERASE EVENT VĨNH VIỄN**
4. Ngày 4+: Event không bao giờ xuất hiện lại

---

## KIỂM TRA DEBUG

Mở Console (F8) và chạy:

```javascript
// Kiểm tra limit của event hiện tại
var ev = $gameMap.event(1); // 1 = Event ID
console.log('Daily Limit:', ev.getDailyLimit());
console.log('Loot Count:', ev.getLootCount());
console.log('Can Loot Today:', ev.canLootToday());
console.log('Has Daily Reset:', ev.hasDailyReset());
```

---

## VỀ SWITCH #18, #19, #20

### CÂU HỎI:
> "Phải tạo chính xác Switch #20, #21, #23? Tôi tạo switch 18, 19, 20 được không?"

### TRẢ LỜI: **ĐƯỢC**

Bạn có thể dùng bất kỳ Switch nào bạn muốn!

### CÁCH ĐỔI SWITCH:

1. Mở **Plugin Manager**
2. Chọn **DailyConsumption**
3. Sửa các parameter:
   - **Stove Switch ID**: 18 (thay vì 20)
   - **Gas Switch ID**: 19 (thay vì 23)
   - **Chef Character Switch ID**: 20 (thay vì 21)
4. Save lại

### CÁCH KÍCH HOẠT SWITCH:

**Cách 1: Dùng Plugin Command (Đơn giản nhất)**
```
◆Plugin Command: DailyConsumption setStove on
```

Plugin sẽ tự động bật Switch #18 (hoặc số nào bạn đặt trong parameters).

**Cách 2: Bật Switch thủ công**
```
◆Control Switches: #0018 Có Bếp = ON
```

**Cả 2 cách đều hoạt động!** Plugin Command thuận tiện hơn vì không cần nhớ số Switch.

---

## CÁC LỖI THƯỜNG GẶP

### 1. Event không cho item khi bấm vào
**Nguyên nhân**: 
- Không có `<dailyLimit: X>` trong Event Note
- Dùng sai script: `this.canLootToday()` thay vì `$gameMap.event(this._eventId).canLootToday()`
- Plugin chưa được load (kiểm tra Plugin Manager)

**Giải pháp**:
- Kiểm tra Event Note có đúng tags không
- Sửa lại script calls như hướng dẫn trên
- Vào Plugin Manager, đảm bảo DailyConsumption = ON

### 2. Event không reset mỗi ngày
**Nguyên nhân**: Thiếu `<dailyReset>` trong Event Note

**Giải pháp**: Thêm `<dailyReset>` vào Event Note

### 3. Event biến mất vĩnh viễn sau 1 lần loot
**Nguyên nhân**: 
- Không có `<dailyReset>`
- HOẶC dùng `Erase Event` thay vì `Self Switch A = ON`

**Giải pháp**: 
- Thêm `<dailyReset>` nếu muốn reset
- Dùng `Self Switch A = ON` cho page 1, tạo page 2 trống

---

## TÓM TẮT

| Yêu cầu | Event Note | Hành động sau loot |
|---------|-----------|-------------------|
| Reset mỗi ngày (vô hạn) | `<dailyReset>` | Self Switch A = ON |
| Giới hạn X lần/ngày, reset | `<dailyLimit: X>` + `<dailyReset>` | Self Switch A = ON |
| Chỉ loot X lần vĩnh viễn | `<dailyLimit: X>` | Self Switch A = ON |
| Erase sau X lần tổng | `<dailyLimit: X>` + `<dailyReset>` | Conditional Erase |

### Script Calls quan trọng:
```javascript
// Kiểm tra có thể loot không
$gameMap.event(this._eventId).canLootToday()

// Ghi nhận đã loot
$gameMap.event(this._eventId).recordLoot()

// Lấy số lần đã loot
$gameMap.event(this._eventId).getLootCount()

// Lấy giới hạn tối đa
$gameMap.event(this._eventId).getDailyLimit()
```
