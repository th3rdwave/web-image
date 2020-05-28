import type { ObjectFitProperty } from 'csstype';
import * as React from 'react';
import {
  ImageResizeMode,
  View,
  ImageProps as BaseImageProps,
} from 'react-native-web';

type ImageSource = any;

const resolveSource = (
  source: ImageSource,
): {
  uri: string | undefined;
  sources: { srcSet: string; type: string }[] | undefined;
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
    const sourceObject =
      typeof source.default === 'object' ? source.default : source;
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
): ObjectFitProperty => {
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

type Props = BaseImageProps & { critical?: boolean };

export const Image = React.forwardRef<any, Props>(
  (
    {
      source,
      resizeMode,
      accessibilityLabel,
      width,
      height,
      critical,
      style,
      ...others
    },
    ref,
  ) => {
    const resolvedSource = resolveSource(source);
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
          style,
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
            />
          </picture>
        )}
      </View>
    );
  },
);
