import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, View, useWindowDimensions, type ScrollViewInstance, type ViewInstance } from 'react-native';

import { Icon, AppText } from '@/components/UiComponents';
import { money } from '@/data';
import { useTheme } from '@/theme';
import type { AirtimeProduct } from '@/types/airtime';

const priceLabel = (product: AirtimeProduct) =>
  product.isRange ? `$${product.min}–$${product.max}` : product.price === null ? 'Price TBC' : money(product.price);

/** A product can be chosen when it has a fixed price or a range. */
export const isAvailable = (product: AirtimeProduct) =>
  product.isRange ? product.max >= product.min && product.max > 0 : product.price !== null;

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
  const theme = useTheme();
  const windowDimensions = useWindowDimensions();
  const field = useRef<ViewInstance>(null);
  const listRef = useRef<ScrollViewInstance>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const options = packages;
  const selectedProduct = options.find((option) => option.id === selectedId);

  const handleOpenPicker = () => field.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }));
  const handleClosePicker = () => setAnchor(null);

  const roomBelow = anchor ? windowDimensions.height - (anchor.y + anchor.height + GAP) - 24 : 0;
  const shouldDropUp = anchor !== null && roomBelow < 220 && anchor.y > roomBelow;
  const listHeight = anchor ? Math.min(LIST_MAX_HEIGHT, shouldDropUp ? anchor.y - GAP - 60 : roomBelow) : 0;

  return (
    <>
      <Pressable
        ref={field}
        onPress={handleOpenPicker}
        accessibilityRole="button"
        accessibilityState={{ expanded: anchor !== null }}
        accessibilityLabel={`Package: ${selectedProduct?.name ?? 'Select a package'}`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          minHeight: 50,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderWidth: 1,
          borderColor: anchor ? theme.brandText : theme.fieldBorder,
          borderRadius: 12,
          backgroundColor: theme.field,
        }}>
        <AppText variant="strong" style={{ flex: 1, fontSize: 15 }}>
          {selectedProduct?.name ?? 'Select a package'}
        </AppText>
        {selectedProduct ? (
          <AppText variant="display" style={{ fontSize: 15 }}>
            {priceLabel(selectedProduct)}
          </AppText>
        ) : null}
        <Icon name={anchor ? 'up' : 'down'} size={16} color={theme.muted} />
      </Pressable>

      <Modal visible={anchor !== null} transparent animationType="fade" onRequestClose={handleClosePicker}>
        <Pressable style={{ flex: 1 }} onPress={handleClosePicker} accessibilityLabel="Close package list" />
        {anchor ? (
          <View
            style={{
              position: 'absolute',
              left: anchor.x,
              width: anchor.width,
              ...(shouldDropUp ? { bottom: windowDimensions.height - anchor.y + GAP } : { top: anchor.y + anchor.height + GAP }),
              maxHeight: listHeight,
              borderRadius: 14,
              backgroundColor: theme.card,
              shadowColor: '#0A0C2A',
              shadowOpacity: 0.18,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 8 },
              elevation: 12,
            }}>
            <View style={{ maxHeight: listHeight, borderRadius: 14, borderWidth: 1, borderColor: theme.line, overflow: 'hidden' }}>
              <ScrollView
                ref={listRef}
                nestedScrollEnabled
                persistentScrollbar
                onLayout={() => listRef.current?.flashScrollIndicators()}>
                {options.map((option, index) => {
                  const isSelected = option.id === selectedId;
                  const isOptionAvailable = isAvailable(option);
                  return (
                    <Pressable
                      key={option.id}
                      disabled={!isOptionAvailable}
                      onPress={() => {
                        onSelect(option.id);
                        handleClosePicker();
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected, disabled: !isOptionAvailable }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        minHeight: 50,
                        paddingVertical: 11,
                        paddingHorizontal: 14,
                        borderTopWidth: index === 0 ? 0 : 1,
                        borderTopColor: theme.lineSoft,
                        backgroundColor: isSelected ? theme.brandTint : 'transparent',
                      }}>
                      <AppText variant="strong" style={{ flex: 1, fontSize: 15, opacity: isOptionAvailable ? 1 : 0.5 }}>
                        {option.name}
                      </AppText>
                      {isOptionAvailable && !option.isRange ? (
                        <AppText variant="display" style={{ fontSize: 15 }}>
                          {priceLabel(option)}
                        </AppText>
                      ) : (
                        <AppText variant="small">{priceLabel(option)}</AppText>
                      )}
                      <View style={{ width: 18, alignItems: 'center' }}>
                        {isSelected ? <Icon name="check" size={16} color={theme.brandText} /> : null}
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
