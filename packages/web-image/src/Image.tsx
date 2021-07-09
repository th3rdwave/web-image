import type { Property } from 'csstype';
import * as React from 'react';
import {
  ImageProps as BaseImageProps,
  ImageResizeMode,
  ImageStyle,
  ImageURISource as BaseImageURISource,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

export interface ResponsiveImageSource {
  /**
   * [srcset](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-srcset) for this source type.
   */
  srcSet: string;
  /**
   * Mime type for this source.
   */
  type: string;
}

export interface ImageURISource extends BaseImageURISource {
  /**
   * Responsive image sources.
   */
  sources?: ResponsiveImageSource[] | null;
}

export type ImageSourcePropType = ImageURISource | ImageURISource[] | number;

const interopDefault = (source: any): ImageURISource =>
  typeof source.default === 'object' ? source.default : source;

const resolveSource = (
  source: ImageSourcePropType,
): {
  uri: string | undefined;
  sources: ResponsiveImageSource[] | null | undefined;
  width: number | undefined;
  height: number | undefined;
} => {
  if (source == null || typeof source === 'string') {
    return {
      uri: source,
      sources: undefined,
      width: undefined,
      height: undefined,
    };
  } else if (typeof source === 'object') {
    const sourceObject = interopDefault(source);
    const width =
      typeof sourceObject.width === 'number' ? sourceObject.width : undefined;
    const height =
      typeof sourceObject.height === 'number' ? sourceObject.height : undefined;
    return {
      uri: sourceObject.uri,
      sources: sourceObject.sources,
      width,
      height,
    };
  } else {
    return {
      uri: undefined,
      sources: undefined,
      width: undefined,
      height: undefined,
    };
  }
};

const resizeModeToObjectFit = (
  resizeMode: ImageResizeMode,
): Property.ObjectFit => {
  switch (resizeMode) {
    case 'cover':
      return 'cover';
    case 'contain':
      return 'contain';
    case 'stretch':
      return 'fill';
    case 'center':
      return 'none';
    default:
      throw new Error('Unsupported resize mode: ' + resizeMode);
  }
};

let _filterId = 0;

// https://github.com/necolas/react-native-web/blob/master/packages/react-native-web/src/exports/Image/index.js
const createTintColorSVG = (
  tintColor: string | null | undefined,
  id: number | null | undefined,
) => {
  return tintColor != null && id != null ? (
    <svg
      style={{
        position: 'absolute',
        height: 0,
        visibility: 'hidden',
        width: 0,
      }}
    >
      <defs>
        {/* @ts-expect-error */}
        <filter id={`tint-${id}`} suppressHydrationWarning={true}>
          <feFlood floodColor={`${tintColor}`} key={tintColor} />
          <feComposite in2="SourceAlpha" operator="atop" />
        </filter>
      </defs>
    </svg>
  ) : null;
};

const getFlatStyle = (
  style: StyleProp<ImageStyle> | null | undefined,
  blurRadius: number | null | undefined,
  filterId: number | null | undefined,
) => {
  const flatStyle = { ...StyleSheet.flatten(style) };
  const { filter, tintColor } = flatStyle as any;

  // Add CSS filters
  // React Native exposes these features as props and proprietary styles
  const filters = [];
  let _filter = null;

  if (filter) {
    filters.push(filter);
  }
  if (blurRadius) {
    filters.push(`blur(${blurRadius}px)`);
  }
  if (tintColor && filterId != null) {
    filters.push(`url(#tint-${filterId})`);
  }

  if (filters.length > 0) {
    _filter = filters.join(' ');
  }

  // These styles are converted to CSS filters applied to the
  // element displaying the background image.
  delete flatStyle.tintColor;
  // These styles are not supported on View
  delete flatStyle.overlayColor;
  delete flatStyle.resizeMode;

  return [flatStyle as ViewStyle, _filter, tintColor];
};

export interface ImageProps extends Omit<BaseImageProps, 'source'> {
  /**
   * If the image should not be lazy loaded.
   *
   * @platform web
   */
  critical?: boolean;
  /**
   * If the image is draggable.
   *
   * @platform web
   */
  draggable?: boolean;
  source: ImageSourcePropType;
}

export const Image = React.forwardRef<View, ImageProps>(
  (
    {
      source,
      resizeMode: propsResizeMode,
      accessibilityLabel,
      width,
      height,
      critical,
      style,
      draggable,
      blurRadius,
      ...others
    },
    ref,
  ) => {
    const filterRef = React.useRef(_filterId++);
    const resolvedSource = resolveSource(source);
    const [flatStyle, _resizeMode, filter, tintColor] = getFlatStyle(
      style,
      blurRadius,
      filterRef.current,
    );
    const resizeMode = propsResizeMode ?? _resizeMode;

    return (
      <View
        ref={ref}
        style={[
          {
            overflow: 'hidden',
            width:
              width === undefined && resolvedSource.width != null
                ? resolvedSource.width
                : width,
            height,
          },
          flatStyle,
        ]}
        {...others}
      >
        {resolvedSource.width != null && resolvedSource.height != null && (
          <div
            style={{
              paddingTop: `${
                (resolvedSource.height / resolvedSource.width) * 100
              }%`,
            }}
          />
        )}
        {source != null && (
          <picture
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            {resolvedSource.sources?.map((s: any, i: number) => (
              <source
                key={i}
                srcSet={s.srcSet}
                media={s.media}
                sizes={s.sizes}
                type={s.type}
              />
            ))}
            <img
              style={{
                width: '100%',
                height: '100%',
                filter,
                objectFit: resizeModeToObjectFit(
                  resizeMode ??
                    // When using intrinsic size use contain to avoid
                    // rounding errors causing some pixel lost.
                    (resolvedSource.width != null && width == null
                      ? 'contain'
                      : 'cover'),
                ),
              }}
              src={resolvedSource.uri}
              loading={critical ? 'eager' : 'lazy'}
              alt={accessibilityLabel}
              width={resolvedSource.width}
              height={resolvedSource.height}
              draggable={draggable}
            />
          </picture>
        )}
        {createTintColorSVG(tintColor, filterRef.current)}
      </View>
    );
  },
);
