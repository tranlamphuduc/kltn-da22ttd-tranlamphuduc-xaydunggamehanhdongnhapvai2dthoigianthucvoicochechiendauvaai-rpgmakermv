# HƯỚNG DẪN TĂNG CHỈ SỐ NHÂN VẬT

## SỰ KIỆN TĂNG HP VÀ ATTACK

### Script đúng (có lưu vào Variable):

```
◆Script: var actor = $gameActors.actor(1);
◆Script: var hpIncrease = Math.floor(actor.mhp * 0.10);
◆Script: var atkIncrease = Math.floor(actor.atk * 0.15);
◆Script: $gameVariables.setValue(1, hpIncrease);
◆Script: $gameVariables.setValue(2, atkIncrease);
◆Script: actor.addParam(0, hpIncrease);
◆Script: actor.addParam(2, atkIncrease);

◆Text: HP tối đa +\V[1]
◆Text: Sức tấn công +\V[2]
```

---

## HOẶC CÁCH ĐƠN GIẢN HƠN (1 SCRIPT):

```
◆Script: var actor = $gameActors.actor(1); var hpInc = Math.floor(actor.mhp * 0.10); var atkInc = Math.floor(actor.atk * 0.15); $gameVariables.setValue(1, hpInc); $gameVariables.setValue(2, atkInc); actor.addParam(0, hpInc); actor.addParam(2, atkInc);

◆Text: HP tối đa +\V[1]
◆Text: Sức tấn công +\V[2]
```

---

## DEBUG: KIỂM TRA HP ĐÃ TĂNG CHƯA

Console (F12):
```javascript
var actor = $gameActors.actor(1);
console.log('Max HP:', actor.mhp);
console.log('Attack:', actor.atk);
```

Nếu **Max HP = 450** → Chưa tăng hoặc đã tăng trước đó!

---

## VẤN ĐỀ: HP KHÔNG TĂNG?

### Nguyên nhân 1: Event đã chạy trước đó (Self Switch A = ON)
→ Event không chạy lại!

### Nguyên nhân 2: Script lỗi
→ Kiểm tra Console (F12) có lỗi không

### Nguyên nhân 3: actor.addParam() bị giới hạn bởi Class Max
→ Actor Class có giới hạn Max HP!

---

## KIỂM TRA CLASS MAX PARAMS

Console:
```javascript
var actor = $gameActors.actor(1);
console.log('Current Max HP:', actor.mhp);
console.log('Param Plus (bonus):', actor._paramPlus[0]); // HP bonus
console.log('Class Max HP at level', actor.level, ':', actor.currentClass().params[0][actor.level]);
```

Nếu `Class Max HP` thấp hơn current → **KHÔNG THỂ TĂNG THÊM**!

---

## GIẢI PHÁP: DÙNG EQUIPMENT HOẶC STATES

### Cách 1: Tăng qua Equipment (Permanent Item)

Tạo **Accessory** (phụ kiện) với bonus HP:

Database → Armors → New → Type: Accessory
- Name: "Heart Container"
- Max HP: +50
- Attack: +10

Event:
```
◆Text: Bạn nhận được Heart Container!
◆Change Equipment: [Actor 1], Accessory = Heart Container
◆Text: Max HP +50! Attack +10!
```

### Cách 2: Tăng qua State (Buff vĩnh viễn)

Database → States → New
- Name: "Power Blessing"
- Remove: Never
- Max HP: +10%
- Attack: +15%

Event:
```
◆Text: Bạn nhận được phép phù hộ!
◆Change State: [Actor 1], + Power Blessing
◆Text: Max HP +10%! Attack +15%!
```

---

## TẠI SAO addParam() KHÔNG HOẠT ĐỘNG?

`actor.addParam()` chỉ tăng `_paramPlus`, NHƯNG:
- **Bị giới hạn bởi Class params max**
- **Reset khi level up** (nếu không dùng plugin)

## GIẢI PHÁP TỐT NHẤT: DÙNG PLUGIN

Cài plugin **YEP_BaseParamControl** để tăng params vĩnh viễn không bị giới hạn!

Hoặc dùng **State** vĩnh viễn (Remove: Never)!
