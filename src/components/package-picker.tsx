import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';

import { Icon, T } from '@/components/ui';
import { money } from '@/data';
import { useTheme } from '@/theme';
import type { AirtimeProduct } from '@/types/airtime';

const priceLabel = (p: AirtimeProduct) =>
  p.isRange ? `$${p.min}–$${p.max}` : p.price === null ? 'Price TBC' : money(p.price);

/** A product can be chosen when it has a fixed price or a range. */
export const isAvailable = (p: AirtimeProduct) => (p.isRange ? p.max >= p.min && p.max > 0 : p.price !== null);

const LIST_MAX_HEIGHT = 330;
const GAP = 6;

type Anchor = { x: number; y: number; width: number; height: number };

/**
 * A select field for the packages the API returned for an operator. The list drops down from the
 * field over the page; it opens upward when there isn't room below.
 */
export function PackagePicker({
  packages,
  selectedId,
  onSelect,
}: {
  packages: AirtimeProduct[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const c = useTheme();
  const window = useWindowDimensions();
  const field = useRef<View>(null);
  const list = useRef<ScrollView>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const options = packages;
  const selected = options.find((o) => o.id === selectedId);

  const open = () => field.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }));
  const close = () => setAnchor(null);

  const roomBelow = anchor ? window.height - (anchor.y + anchor.height + GAP) - 24 : 0;
  const dropUp = anchor !== null && roomBelow < 220 && anchor.y > roomBelow;
  const listHeight = anchor ? Math.min(LIST_MAX_HEIGHT, dropUp ? anchor.y - GAP - 60 : roomBelow) : 0;

  return (
    <>
      <Pressable
        ref={field}
        onPress={open}
        accessibilityRole="button"
        accessibilityState={{ expanded: anchor !== null }}
        accessibilityLabel={`Package: ${selected?.name ?? 'Select a package'}`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          minHeight: 50,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderWidth: 1,
          borderColor: anchor ? c.brandText : c.fieldBorder,
          borderRadius: 12,
          backgroundColor: c.field,
        }}>
        <T v="strong" style={{ flex: 1, fontSize: 15 }}>
          {selected?.name ?? 'Select a package'}
        </T>
        {selected ? (
          <T v="display" style={{ fontSize: 15 }}>
            {priceLabel(selected)}
          </T>
        ) : null}
        <Icon name={anchor ? 'up' : 'down'} size={16} color={c.muted} />
      </Pressable>

      <Modal visible={anchor !== null} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={{ flex: 1 }} onPress={close} accessibilityLabel="Close package list" />
        {anchor ? (
          <View
            style={{
              position: 'absolute',
              left: anchor.x,
              width: anchor.width,
              ...(dropUp ? { bottom: window.height - anchor.y + GAP } : { top: anchor.y + anchor.height + GAP }),
              maxHeight: listHeight,
              borderRadius: 14,
              backgroundColor: c.card,
              shadowColor: '#0A0C2A',
              shadowOpacity: 0.18,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 8 },
              elevation: 12,
            }}>
            <View style={{ maxHeight: listHeight, borderRadius: 14, borderWidth: 1, borderColor: c.line, overflow: 'hidden' }}>
              <ScrollView
                ref={list}
                nestedScrollEnabled
                persistentScrollbar
                onLayout={() => list.current?.flashScrollIndicators()}>
                {options.map((o, i) => {
                  const isSelected = o.id === selectedId;
                  const available = isAvailable(o);
                  return (
                    <Pressable
                      key={o.id}
                      disabled={!available}
                      onPress={() => {
                        onSelect(o.id);
                        close();
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected, disabled: !available }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        minHeight: 50,
                        paddingVertical: 11,
                        paddingHorizontal: 14,
                        borderTopWidth: i === 0 ? 0 : 1,
                        borderTopColor: c.lineSoft,
                        backgroundColor: isSelected ? c.brandTint : 'transparent',
                      }}>
                      <T v="strong" style={{ flex: 1, fontSize: 15, opacity: available ? 1 : 0.5 }}>
                        {o.name}
                      </T>
                      {available && !o.isRange ? (
                        <T v="display" style={{ fontSize: 15 }}>
                          {priceLabel(o)}
                        </T>
                      ) : (
                        <T v="small">{priceLabel(o)}</T>
                      )}
                      <View style={{ width: 18, alignItems: 'center' }}>
                        {isSelected ? <Icon name="check" size={16} color={c.brandText} /> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        ) : null}
      </Modal>
    </>
  );
}
